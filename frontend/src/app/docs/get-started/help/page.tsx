export default function HelpPage() {
  return (
    <article className="max-w-none">
      <div className="mb-12">
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-4">
          Always updated
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Help and FAQ
        </h1>
        <p className="text-lg text-muted-foreground">
           Find answers to common questions. We are here to help you succeed with
           Relief-ED.
        </p>
      </div>

      <section className="mb-12 grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h3 className="font-heading font-semibold text-foreground">
            In-App Help
          </h3>
          <p className="text-sm text-muted-foreground">
            Look for help icons throughout Relief-ED for contextual guidance and
            tooltips.
          </p>
          <p className="text-xs text-muted-foreground">
            Available 24/7 directly in your dashboard
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h3 className="font-heading font-semibold text-foreground">
            Email Support
          </h3>
          <p className="text-sm text-muted-foreground">
            Contact our support team for specific issues or complex questions.
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            support@edutool.com
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6">
          General Questions
        </h2>
        <div className="space-y-3">
          {[
            { q: "What makes Relief-ED different from other school management systems?", a: "Relief-ED is built for flexibility. Unlike rigid systems, Relief-ED lets you define your own programs, levels, and structures. It is equally suited for SHS schools, colleges, or custom educational setups." },
            { q: "Is Relief-ED a cloud-based system?", a: "Yes, Relief-ED is fully cloud-based and multi-tenant. Your school data is secure, isolated, and accessible from anywhere with an internet connection." },
            { q: "How many students can I enroll?", a: "There is no hard limit. Relief-ED scales to thousands of students. Performance is optimized for large schools." },
            { q: "Can I integrate Relief-ED with other systems?", a: "Yes, Relief-ED provides API endpoints for integration. Contact support to discuss your specific needs." },
          ].map((item, idx) => (
            <details
              key={idx}
              className="group rounded-xl border bg-card cursor-pointer hover:border-primary/30 transition-colors"
            >
              <summary className="flex items-center justify-between p-4 font-semibold text-foreground">
                {item.q}
                <span className="text-muted-foreground group-open:rotate-180 transition-transform text-xs">
                  ▼
                </span>
              </summary>
              <p className="text-muted-foreground px-4 pb-4 text-sm">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6">
          For School Admins
        </h2>
        <div className="space-y-3">
          {[
            { q: "I accidentally deleted a class. Can I recover it?", a: "Classes deleted less than 30 days ago can be recovered. Go to Admin Dashboard, Audit Log and search for the deletion. Contact support if you need to restore it." },
            { q: "How do I reset a student password?", a: "Go to the student profile and click 'Reset Password'. An automated email with reset instructions will be sent to the student." },
            { q: "Can I export student data?", a: "Yes, you can export student lists and enrollment data as CSV from the Students page. Advanced reports are available in Analytics." },
            { q: "What happens if an educator leaves? Can I transfer their classes?", a: "Yes. Go to the educator profile and reassign classes to another educator. Grades and attendance records remain intact." },
            { q: "How do I set up custom email addresses for students?", a: "Configure your email extension in Organization Settings (e.g., @myschool.edu). Relief-ED will auto-generate emails when you create students." },
            { q: "Can I have multiple admins for my school?", a: "Yes, you can create additional admin accounts with the same permissions. Go to Admin Settings, Manage Admins." },
          ].map((item, idx) => (
            <details
              key={idx}
              className="group rounded-xl border bg-card cursor-pointer hover:border-primary/30 transition-colors"
            >
              <summary className="flex items-center justify-between p-4 font-semibold text-foreground">
                {item.q}
                <span className="text-muted-foreground group-open:rotate-180 transition-transform text-xs">
                  ▼
                </span>
              </summary>
              <p className="text-muted-foreground px-4 pb-4 text-sm">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6">
          For Educators
        </h2>
        <div className="space-y-3">
          {[
            { q: "How do I enter grades for my class?", a: "Go to your Class, Grades. You will see a list of enrolled students. Click on a student to enter component grades (quizzes, exams, etc.). The final grade is automatically calculated." },
            { q: "Can I lock my own grades or only admins?", a: "Only admins can lock grades. Once locked by admin, you cannot modify grades without admin permission." },
            { q: "How do I create assessments?", a: "Go to your Class, Assessments, Create New. Define the assessment details and attach rubrics if needed." },
            { q: "Can I give partial credit on assessments?", a: "Yes. When grading submissions, you can assign any score up to the maximum. Comment on specific issues to help students improve." },
            { q: "Where do I find the grading scheme for my class?", a: "Go to your Class, Grading Scheme. You will see the components and weights. If you need to change it, contact your admin." },
          ].map((item, idx) => (
            <details
              key={idx}
              className="group rounded-xl border bg-card cursor-pointer hover:border-primary/30 transition-colors"
            >
              <summary className="flex items-center justify-between p-4 font-semibold text-foreground">
                {item.q}
                <span className="text-muted-foreground group-open:rotate-180 transition-transform text-xs">
                  ▼
                </span>
              </summary>
              <p className="text-muted-foreground px-4 pb-4 text-sm">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6">
          For Students
        </h2>
        <div className="space-y-3">
          {[
            { q: "How do I view my grades?", a: "Go to your Class, Grades. You will see all your grades for that class, including component scores and final grade." },
            { q: "Can I submit assignments late?", a: "Depending on your educator settings, you may be able to submit late assignments. Check the assignment deadline before submitting." },
            { q: "How do I change my password?", a: "Click your profile icon (top right), Settings, Change Password. Enter your current password and new password." },
            { q: "What is a transcript and how do I access it?", a: "Your transcript is a complete record of all grades from all classes. Go to Student Dashboard, Transcript to view it." },
          ].map((item, idx) => (
            <details
              key={idx}
              className="group rounded-xl border bg-card cursor-pointer hover:border-primary/30 transition-colors"
            >
              <summary className="flex items-center justify-between p-4 font-semibold text-foreground">
                {item.q}
                <span className="text-muted-foreground group-open:rotate-180 transition-transform text-xs">
                  ▼
                </span>
              </summary>
              <p className="text-muted-foreground px-4 pb-4 text-sm">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Troubleshooting
        </h2>
        <div className="space-y-3">
          {[
            { problem: "I cannot log in", solution: "Check that your email and password are correct. If you forgot your password, click 'Forgot Password' on the login page." },
            { problem: "Grades are not displaying correctly", solution: "Refresh your browser (Ctrl+F5 or Cmd+Shift+R). If the issue persists, clear your browser cache or try a different browser." },
            { problem: "Students do not appear in my class roster", solution: "Verify students are enrolled in the correct program and level. Check the School Year selector. You might be viewing a different year." },
            { problem: "CSV import is failing", solution: "Check the CSV format matches the template. Common issues include duplicate emails, missing required fields, or program names that do not exist." },
          ].map((item, idx) => (
            <div key={idx} className="rounded-xl border bg-card p-4 space-y-2">
              <h4 className="font-semibold text-foreground">{item.problem}</h4>
              <p className="text-sm text-muted-foreground">{item.solution}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 space-y-3">
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Still Need Help?
        </h3>
        <p className="text-sm text-muted-foreground">
          We are here for you. Reach out to our support team:
        </p>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Email:</strong>{" "}
            <a href="mailto:support@edutool.com" className="text-primary hover:underline">
              support@edutool.com
            </a>
          </p>
          <p>
            <strong className="text-foreground">Response time:</strong> Usually within 24 hours
          </p>
          <p>
            <strong className="text-foreground">Available:</strong> Monday - Friday, 9 AM - 5 PM (UTC+8)
          </p>
        </div>
      </section>
    </article>
  );
}