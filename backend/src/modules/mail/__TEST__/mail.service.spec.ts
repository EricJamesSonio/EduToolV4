import { MailService } from '../mail.service';

const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

describe('MailService', () => {
  let service: MailService;
  let config: any;

  beforeEach(() => {
    config = {
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          GMAIL_EMAIL: 'test@gmail.com',
          GMAIL_APP_PASSWORD: 'apppass',
          APP_NAME: 'TestApp',
        };
        return map[key] ?? null;
      }),
    };
    service = new MailService(config);
    jest.clearAllMocks();
  });

  it('sendOtpEmail sends with correct subject and code', async () => {
    mockSendMail.mockResolvedValue({});
    await service.sendOtpEmail('user@example.com', '123456');
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'user@example.com',
      subject: expect.stringContaining('Verification Code'),
      html: expect.stringContaining('123456'),
    }));
  });

  it('sendOtpEmail throws on failure', async () => {
    mockSendMail.mockRejectedValue(new Error('smtp fail'));
    await expect(service.sendOtpEmail('user@example.com', '123456')).rejects.toThrow('smtp fail');
  });

  it('sendCredentialsEmail sends loginEmail and password', async () => {
    mockSendMail.mockResolvedValue({});
    await service.sendCredentialsEmail('recipient@example.com', 'login@school.edu', 'Pass123!');
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'recipient@example.com',
      html: expect.stringContaining('login@school.edu'),
    }));
    expect(mockSendMail.mock.calls[0][0].html).toContain('Pass123!');
  });

  it('sendRejectionEmail includes reason when provided', async () => {
    mockSendMail.mockResolvedValue({});
    await service.sendRejectionEmail('user@example.com', 'Missing docs');
    expect(mockSendMail.mock.calls[0][0].html).toContain('Missing docs');
  });

  it('sendRejectionEmail without reason still sends', async () => {
    mockSendMail.mockResolvedValue({});
    await service.sendRejectionEmail('user@example.com');
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'user@example.com' }));
  });

  it('sendRevisionNeededEmail lists field notes', async () => {
    mockSendMail.mockResolvedValue({});
    await service.sendRevisionNeededEmail('user@example.com', { full_name: 'fix name', plan: 'choose plan' });
    const html = mockSendMail.mock.calls[0][0].html;
    expect(html).toContain('full_name');
    expect(html).toContain('fix name');
    expect(html).toContain('plan');
  });

  it('sendStudentCredentialsEmail sends', async () => {
    mockSendMail.mockResolvedValue({});
    await service.sendStudentCredentialsEmail('personal@email.com', 'student@school.edu', 'StudPass!');
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'personal@email.com', html: expect.stringContaining('student@school.edu') }));
  });

  it('sendApplicationConfirmationEmail sends code and orgName', async () => {
    mockSendMail.mockResolvedValue({});
    await service.sendApplicationConfirmationEmail('app@example.com', 'John', 'CODE123', 'Test School');
    const html = mockSendMail.mock.calls[0][0].html;
    expect(html).toContain('John');
    expect(html).toContain('CODE123');
    expect(html).toContain('Test School');
  });

  it('sendConcernDigestEmail handles singular vs plural', async () => {
    mockSendMail.mockResolvedValue({});
    await service.sendConcernDigestEmail('admin@school.edu', 1);
    expect(mockSendMail.mock.calls[0][0].subject).toContain('1 new concern ');
    mockSendMail.mockClear();
    await service.sendConcernDigestEmail('admin@school.edu', 5);
    expect(mockSendMail.mock.calls[0][0].subject).toContain('5 new concerns');
  });

  it('uses fallback APP_NAME when not set', async () => {
    config.get.mockImplementation((k: string) => (k === 'APP_NAME' ? undefined : 'test@gmail.com'));
    mockSendMail.mockResolvedValue({});
    await service.sendOtpEmail('user@example.com', '123');
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({ from: expect.stringContaining('EduTool') }));
  });
});
