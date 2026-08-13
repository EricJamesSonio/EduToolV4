// src/modules/enrollment-portal/enrollment-portal.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '@/modules/auth/auth.service';
import { MailService } from '@/modules/mail/mail.service';
import { generateRandomCode } from '@/commons/utils/random-code.util';
import { PersonalEmailRegistryService } from '@/commons/services/personal-email-registry.service';
import { EnrollmentPortalRepository } from './enrollment-portal.repository';
import { resolveSelectionShape } from './enrollment-selection.mapper';
import { resultToApplicationView } from './serializers';
import {
  EnrollmentSessionClaims,
  PublicPortalInfo,
} from './entity/enrollment-portal.entity';
import {
  SendEnrollmentOtpDto,
  VerifyEnrollmentOtpDto,
  UpsertEnrollmentApplicationDto,
} from './dto/enrollment-portal.dto';

const APPLICATION_CODE_LENGTH = 4;
const MAX_CODE_ATTEMPTS = 12;
const SESSION_TTL = '2h';

@Injectable()
export class EnrollmentPortalService {
  constructor(
    private readonly repo: EnrollmentPortalRepository,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly personalEmailRegistry: PersonalEmailRegistryService,
  ) {}

  verifySessionToken(token: string): EnrollmentSessionClaims {
    return this.jwtService.verify<EnrollmentSessionClaims>(token);
  }

  async getPortal(orgSlug: string, periodToken: string): Promise<PublicPortalInfo> {
    const org = await this.repo.findBySlug(orgSlug);
    if (!org) throw new NotFoundException('Enrollment link not found.');

    const period = await this.repo.findPeriodByToken(periodToken, org.id);
    if (!period) throw new NotFoundException('Enrollment link not found.');

    const programs = await this.repo.findProgramsForSchoolYear(org.id, period.school_year_id);

    const now = new Date();
    const isOpen = now >= period.start_date && now <= period.end_date;

    return {
      org: { id: org.id, name: org.name, slug: org.slug as string },
      period: {
        id: period.id,
        name: period.name,
        start_date: period.start_date,
        end_date: period.end_date,
        lock_date: period.lock_date,
        is_open: isOpen,
      },
      schoolYear: { id: period.school_year_id, name: period.schoolYear.name },
      programs: programs.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        courses: p.courses.map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          levels: c.levels.map((l) => ({ id: l.id, name: l.name })),
        })),
        strands: p.strands.map((s) => ({
          id: s.id,
          name: s.name,
          levels: s.levels.map((l) => ({ id: l.id, name: l.name })),
        })),
        levels: p.levels.map((l) => ({ id: l.id, name: l.name })),
      })),
    };
  }

  async sendOtp(orgSlug: string, periodToken: string, dto: SendEnrollmentOtpDto) {
    const { org, period } = await this.resolveOrgAndPeriod(orgSlug, periodToken);
    this.assertAcceptingApplications(period);
    await this.assertEmailNotAlreadyCommitted(org.id, dto.email);

    return this.authService.sendEnrollmentOtp(dto.email, org.id);
  }

  async verifyOtpAndOpenSession(
    orgSlug: string,
    periodToken: string,
    dto: VerifyEnrollmentOtpDto,
  ) {
    const { org, period } = await this.resolveOrgAndPeriod(orgSlug, periodToken);
    this.assertAcceptingApplications(period);

    await this.authService.verifyEnrollmentOtp(dto.email, dto.code, org.id);

    // Global check across all accounts (not just this org / students) — blocks
    // before any session is issued or any existing application data is returned.
    if (await this.personalEmailRegistry.isPersonalEmailInUse(dto.email)) {
      return {
        blocked: true,
        message: 'This Gmail is already linked to an account in EduTool.',
      };
    }

    await this.assertEmailNotAlreadyCommitted(org.id, dto.email);

    const existing = await this.repo.findApplicationByEmail(
      org.id,
      period.school_year_id,
      dto.email,
    );

    const mode: 'edit' | 'create' = existing ? 'edit' : 'create';

    const token = this.signSessionToken({
      type: 'enrollment',
      orgId: org.id,
      schoolYearId: period.school_year_id,
      periodId: period.id,
      personalEmail: dto.email,
      applicationId: existing?.id ?? null,
    });

    return {
      mode,
      token,
      ...(existing ? { application: resultToApplicationView(existing) } : {}),
    };
  }

  async createApplication(
    orgSlug: string,
    periodToken: string,
    session: EnrollmentSessionClaims,
    dto: UpsertEnrollmentApplicationDto,
  ) {
    const { org, period } = await this.resolveOrgAndPeriod(orgSlug, periodToken);
    this.assertSessionMatchesOrg(org, session);
    this.assertAcceptingApplications(period);
    await this.assertEmailNotAlreadyCommitted(org.id, session.personalEmail);

    const existing = await this.repo.findApplicationByEmail(
      org.id,
      period.school_year_id,
      session.personalEmail,
    );
    if (existing) {
      throw new ConflictException(
        'You already have an application for this enrollment. Re-verify your email to edit it.',
      );
    }

    const selection = await this.validateSelection(
      org.id,
      period.school_year_id,
      dto,
    );

    const applicationCode = await this.generateUniqueCode(
      org.id,
      period.school_year_id,
    );

    const application = await this.repo.createApplication({
      orgId: org.id,
      schoolYearId: period.school_year_id,
      periodId: period.id,
      applicationCode,
      email: session.personalEmail,
      firstName: dto.first_name,
      middleName: dto.middle_name,
      lastName: dto.last_name,
      age: dto.age,
      address: dto.address,
      contactNumber: dto.contact_number,
      lastSchoolGraduated: dto.last_school_graduated,
      programId: selection.programId,
      courseId: selection.courseId,
      strandId: selection.strandId,
      levelId: selection.levelId,
    });

    // Best-effort confirmation email; never block a successful application on it.
    this.mailService
      .sendApplicationConfirmationEmail(
        session.personalEmail,
        dto.first_name,
        applicationCode,
        org.name,
      )
      .catch(() => {});

    return resultToApplicationView(application);
  }

  async updateApplication(
    orgSlug: string,
    periodToken: string,
    session: EnrollmentSessionClaims,
    dto: UpsertEnrollmentApplicationDto,
  ) {
    const { org, period } = await this.resolveOrgAndPeriod(orgSlug, periodToken);
    this.assertSessionMatchesOrg(org, session);
    this.assertAcceptingApplications(period);

    if (!session.applicationId) {
      throw new BadRequestException('No application exists to edit.');
    }

    const application = await this.repo.findApplicationById(
      session.applicationId,
      org.id,
    );
    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    if (application.status === 'locked' || application.status === 'approved') {
      throw new BadRequestException(
        'This application is locked and can no longer be edited.',
      );
    }

    const selection = await this.validateSelection(
      org.id,
      period.school_year_id,
      dto,
    );

    const updated = await this.repo.updateApplication(application.id, {
      firstName: dto.first_name,
      middleName: dto.middle_name,
      lastName: dto.last_name,
      age: dto.age,
      address: dto.address,
      contactNumber: dto.contact_number,
      lastSchoolGraduated: dto.last_school_graduated,
      programId: selection.programId,
      courseId: selection.courseId,
      strandId: selection.strandId,
      levelId: selection.levelId,
    });

    return resultToApplicationView(updated);
  }

  async lookupApplication(applicationCode: string, email?: string) {
    const results = await this.repo.findApplicationForLookup(applicationCode, email);

    if (results.length === 0) {
      throw new NotFoundException('No application found for that code.');
    }

    // Without an email to disambiguate, a code that collides across orgs/school
    // years only exposes the most recent match.
    const matches = email ? results : results.slice(0, 1);

    // Public lookup returns only name + status + code (no PII beyond that).
    return matches.map((r) => ({
      application_code: r.application_code,
      full_name: [r.first_name, r.middle_name, r.last_name]
        .filter(Boolean)
        .join(' '),
      status: r.status,
    }));
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private async resolveOrgAndPeriod(orgSlug: string, periodToken: string) {
    const org = await this.repo.findBySlug(orgSlug);
    if (!org) throw new NotFoundException('Enrollment link not found.');

    const period = await this.repo.findPeriodByToken(periodToken, org.id);
    if (!period) throw new NotFoundException('Enrollment link not found.');

    return { org, period };
  }

  /**
   * Blocks an already-admitted applicant (approved application or existing
   * student account) from re-submitting. Pending/rejected applications have no
   * student account and are NOT approved, so they pass through and applicants
   * can keep editing / tracking their existing application.
   */
  private async assertEmailNotAlreadyCommitted(orgId: string, email: string) {
    if (await this.repo.emailAlreadyCommitted(orgId, email)) {
      throw new ConflictException(
        'This email has already been submitted and approved. A student account ' +
          'already exists for it, so it can no longer be used again. ' +
          'Please use a different email address.',
      );
    }
  }

  private assertAcceptingApplications(period: {
    start_date: Date;
    end_date: Date;
  }) {
    const now = new Date();
    if (now < period.start_date) {
      throw new BadRequestException('This enrollment period has not started yet.');
    }
    if (now > period.end_date) {
      throw new BadRequestException('This enrollment period has already closed.');
    }
  }

  private assertSessionMatchesOrg(
    org: { id: string },
    session: EnrollmentSessionClaims,
  ) {
    if (session.orgId !== org.id) {
      throw new BadRequestException('Session does not match this enrollment link.');
    }
  }

  private signSessionToken(claims: EnrollmentSessionClaims): string {
    return this.jwtService.sign(claims, { expiresIn: SESSION_TTL });
  }

  private async generateUniqueCode(orgId: string, schoolYearId: string) {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = generateRandomCode(APPLICATION_CODE_LENGTH);
      const count = await this.repo.countApplicationByCode(
        orgId,
        schoolYearId,
        code,
      );
      if (count === 0) return code;
    }
    throw new ConflictException('Could not generate a unique application code.');
  }

  /**
   * Validates the Program -> Course/Strand -> Level selection against the
   * same conditional the internal admin enrollment flow uses, returning the
   * normalized FK values to persist.
   */
  private async validateSelection(
    orgId: string,
    schoolYearId: string,
    dto: UpsertEnrollmentApplicationDto,
  ): Promise<{
    programId: string;
    courseId: string | null;
    strandId: string | null;
    levelId: string;
  }> {
    const program = await this.repo.findProgramById(orgId, schoolYearId, dto.program_id);
    if (!program) {
      throw new BadRequestException('Invalid program selected.');
    }

    const shape = resolveSelectionShape(program.type);
    let courseId: string | null = null;
    let strandId: string | null = null;

    if (shape.usesCourses) {
      if (!dto.course_id || dto.strand_id) {
        throw new BadRequestException(
          'This program requires selecting a course and no strand.',
        );
      }
      const course = await this.repo.findCourseById(
        orgId,
        schoolYearId,
        program.id,
        dto.course_id,
      );
      if (!course) throw new BadRequestException('Invalid course selected.');
      courseId = dto.course_id;
    } else if (shape.usesStrands) {
      if (!dto.strand_id || dto.course_id) {
        throw new BadRequestException(
          'This program requires selecting a strand and no course.',
        );
      }
      const strand = await this.repo.findStrandById(
        orgId,
        schoolYearId,
        program.id,
        dto.strand_id,
      );
      if (!strand) throw new BadRequestException('Invalid strand selected.');
      strandId = dto.strand_id;
    } else {
      if (dto.course_id || dto.strand_id) {
        throw new BadRequestException(
          'This program does not use courses or strands.',
        );
      }
    }

    const level = await this.repo.findLevelSelection(
      orgId,
      schoolYearId,
      program.id,
      dto.level_id,
    );
    if (!level) throw new BadRequestException('Invalid level selected.');

    if (courseId && level.course_id !== courseId) {
      throw new BadRequestException('The level does not belong to the selected course.');
    }
    if (strandId && level.strand_id !== strandId) {
      throw new BadRequestException('The level does not belong to the selected strand.');
    }
    if (!courseId && !strandId && (level.course_id || level.strand_id)) {
      throw new BadRequestException('The level belongs to a course or strand.');
    }

    return { programId: program.id, courseId, strandId, levelId: level.id };
  }
}