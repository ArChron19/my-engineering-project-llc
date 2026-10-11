import React from "react";
import { PageWrapper } from "@/components/Layout";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">{title}</h2>
      <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-display text-primary">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">
            Effective date: June 8, 2026 &nbsp;·&nbsp; myengineeringproject.com
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-sm leading-relaxed">
          <p>
            <strong>My Engineering Project LLC</strong> ("we," "us," or "our") operates the
            selectNsolve™ Google Sheets add-on and the website{" "}
            <strong>myengineeringproject.com</strong>. This Privacy Policy describes how we collect,
            use, disclose, and protect information about users ("you" or "User") of our Software and
            website. By using the Software or website, you consent to the data practices described
            in this Policy.
          </p>
        </div>

        <Section title="1. Google API Services — Limited Use Disclosure">
          <p>
            selectNsolve™ is a Google Workspace™ add-on. Our use of data received from Google APIs
            is limited to the practices described in this Privacy Policy and complies with the{" "}
            <strong>Google API Services User Data Policy</strong>, including the Limited Use
            requirements. See:{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              developers.google.com/terms/api-services-user-data-policy
            </a>
            .
          </p>
          <p>
            Our access to Google user data is used only to provide or improve the equation-solving
            functionality of the add-on. We do not use this data to serve advertisements, sell to
            third parties, or for any purpose unrelated to the core features of selectNsolve™.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <h3 className="font-semibold text-foreground">2.1 Google Account Information</h3>
          <p>
            The Software operates as a Google Workspace Add-on. When you install the add-on, we may
            access your Google account email address solely for the purpose of subscription
            management and entitlement verification via Stripe.
          </p>

          <h3 className="font-semibold text-foreground">2.2 Usage Data</h3>
          <p>
            We may collect anonymized, aggregated usage data such as feature usage frequency, error
            rates, and performance metrics. We do not collect or store the content of your
            spreadsheets, equations, or computational inputs.
          </p>

          <h3 className="font-semibold text-foreground">2.3 Payment Information</h3>
          <p>
            Payment processing is handled exclusively by Stripe, Inc. We do not collect, store, or
            process payment card numbers. Stripe's{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              Privacy Policy
            </a>{" "}
            governs payment data.
          </p>

          <h3 className="font-semibold text-foreground">2.4 Website Analytics</h3>
          <p>
            Our website uses Google AdSense, which may set cookies and collect data about your visit
            for advertising purposes. This is governed by Google's{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              Privacy Policy
            </a>
            .
          </p>

          <h3 className="font-semibold text-foreground">2.5 Communications</h3>
          <p>
            If you contact us by email, we retain correspondence to respond to your inquiry and
            improve our service.
          </p>
        </Section>

        <Section title="3. How We Use Information">
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide, maintain, and improve the Software;</li>
            <li>To verify your subscription entitlement and billing status;</li>
            <li>To communicate with you about your account, updates, or support requests;</li>
            <li>To comply with legal obligations;</li>
            <li>
              To protect the rights, property, or safety of the Company, our users, or the public.
            </li>
          </ul>
          <p>
            We do <strong>not</strong> sell, rent, or trade your personal information to third
            parties for their marketing purposes.
          </p>
        </Section>

        <Section title="4. No Storage of Computational Data">
          <p>
            The Software performs all calculations locally within your Google Sheets environment. We
            do not transmit, store, log, or retain the contents of your spreadsheets, your
            equations, your variables, your inputs, or your computational outputs. You retain full
            ownership and control of your data.
          </p>
        </Section>

        <Section title="5. Disclaimer Regarding Software Outputs">
          <p className="uppercase font-semibold text-foreground">
            WE MAKE NO REPRESENTATIONS OR WARRANTIES REGARDING THE ACCURACY, COMPLETENESS, OR
            FITNESS FOR PURPOSE OF ANY OUTPUT PRODUCED BY THE SOFTWARE. COLLECTION AND PROCESSING OF
            YOUR INPUTS FOR THE PURPOSE OF COMPUTATION DOES NOT CONSTITUTE AN ENDORSEMENT,
            VERIFICATION, OR VALIDATION OF THOSE INPUTS OR THE RESULTING OUTPUTS. YOU ARE SOLELY
            RESPONSIBLE FOR VERIFYING ALL OUTPUTS INDEPENDENTLY.
          </p>
        </Section>

        <Section title="6. Third-Party Services">
          <p>
            The Software and website interact with the following third-party services, each governed
            by their own privacy policies:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Google LLC</strong> — Google Workspace Marketplace, Google Sheets API, Google
              AdSense, Google Analytics
            </li>
            <li>
              <strong>Stripe, Inc.</strong> — Payment processing and subscription management
            </li>
          </ul>
          <p>We are not responsible for the privacy practices of these third parties.</p>
        </Section>

        <Section title="7. Data Retention">
          <p>
            We retain personal information only as long as necessary to fulfill the purposes
            described in this Policy or as required by law. Upon account deletion or subscription
            termination, we will delete or anonymize your personal information within a reasonable
            time, subject to legal retention requirements.
          </p>
        </Section>

        <Section title="8. Data Security">
          <p>
            We implement commercially reasonable administrative, technical, and physical safeguards
            to protect information in our control. However, no transmission over the internet or
            electronic storage is 100% secure. We cannot guarantee absolute security and disclaim
            liability for unauthorized access beyond our reasonable control.
          </p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>
            The Software is not directed to children under the age of 13. We do not knowingly
            collect personal information from children under 13. If you believe we have
            inadvertently collected such information, please contact us immediately.
          </p>
        </Section>

        <Section title="10. Your Rights (GDPR / CCPA / PIPEDA)">
          <p>
            Depending on your jurisdiction, you may have rights including: access to your personal
            data, correction of inaccurate data, deletion of your data, restriction or objection to
            processing, and data portability. To exercise these rights, contact us at the email
            below. We will respond within the timeframe required by applicable law.
          </p>
          <p>
            <strong>California residents:</strong> We do not sell personal information as defined by
            the CCPA. You have the right to know what data we collect and to request deletion.
          </p>
        </Section>

        <Section title="11. Limitation of Liability for Data Incidents">
          <p className="uppercase font-semibold text-foreground">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, MY ENGINEERING PROJECT LLC'S TOTAL
            LIABILITY ARISING FROM ANY DATA SECURITY INCIDENT, UNAUTHORIZED ACCESS, OR PRIVACY
            VIOLATION SHALL NOT EXCEED THE AMOUNTS SET FORTH IN THE TERMS OF SERVICE LIMITATION OF
            LIABILITY SECTION. THE COMPANY SHALL NOT BE LIABLE FOR INDIRECT, CONSEQUENTIAL,
            INCIDENTAL, OR PUNITIVE DAMAGES ARISING FROM ANY DATA INCIDENT.
          </p>
        </Section>

        <Section title="12. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted to the
            website with a new effective date. Continued use of the Software after the effective
            date constitutes your acceptance of the updated Policy.
          </p>
        </Section>

        <Section title="13. Contact">
          <address className="not-italic bg-muted rounded-xl p-4 text-sm space-y-1">
            <p><strong>My Engineering Project LLC</strong></p>
            <p>
              Email:{" "}
              <a
                href="mailto:contact@myengineeringproject.com"
                className="text-primary underline underline-offset-2"
              >
                contact@myengineeringproject.com
              </a>
            </p>
            <p>
              Website:{" "}
              <a
                href="https://myengineeringproject.com"
                className="text-primary underline underline-offset-2"
              >
                myengineeringproject.com
              </a>
            </p>
          </address>
        </Section>

        <p className="text-sm text-muted-foreground pt-4 border-t border-border">
          &copy; 2026 My Engineering Project LLC. All rights reserved.
        </p>
      </div>
    </PageWrapper>
  );
}
