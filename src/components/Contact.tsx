import { useState, type FormEvent } from 'react';
import { log } from '../lib/logger';
import { useScrollReveal } from '../hooks/useScrollReveal';
import '../styles/contact.css';

export function Contact() {
  const [ref, visible] = useScrollReveal<HTMLDivElement>();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      log.warn('FORM', 'Validation failed — empty fields');
      setStatus('error');
      return;
    }

    setStatus('sending');
    log.info('FORM', `Submitting contact form from "${formData.name}" <${formData.email}>`);

    try {
      const response = await fetch('https://formsubmit.co/ajax/kenjisison2@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
          _subject: `Portfolio contact form — ${formData.name.trim()}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      log.info('FORM', 'Contact form submitted successfully ✓');
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (e) {
      log.error('FORM', 'Contact form submission failed', e);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <section id="contact" className="contact-section" ref={ref}>
      <div className="container">
        <p className="section-label">Let's Connect</p>
        <h2 className="section-title">Get in touch</h2>

        <div className={`contact-layout ${visible ? 'visible' : ''}`}>
          <div className="contact-info">
            <p className="contact-info__text">
              Whether it's about data engineering, analytics, AI/ML, or just to say
              hello — I'd love to hear from you. Drop a message below and I'll get
              back to you soon.
            </p>

            <div className="contact-links">
              <a
                href="mailto:kenjisison2@gmail.com"
                className="contact-link"
              >
                <span className="contact-link__icon">@</span>
                <div>
                  <span className="contact-link__label">Email</span>
                  <span className="contact-link__value">kenjisison2@gmail.com</span>
                </div>
              </a>

              <a
                href="https://www.linkedin.com/in/kenji-sison/"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                <span className="contact-link__icon">in</span>
                <div>
                  <span className="contact-link__label">LinkedIn</span>
                  <span className="contact-link__value">/in/kenji-sison/</span>
                </div>
              </a>

              <a
                href="https://github.com/prosecutorpotato"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                <span className="contact-link__icon">⌥</span>
                <div>
                  <span className="contact-link__label">GitHub</span>
                  <span className="contact-link__value">/prosecutorpotato</span>
                </div>
              </a>
            </div>

            <div className="contact-location">
              <span className="contact-location__pin">◉</span>
              Adelaide, South Australia
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form__field">
              <label htmlFor="contact-name" className="contact-form__label">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                className="contact-form__input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                required
              />
            </div>

            <div className="contact-form__field">
              <label htmlFor="contact-email" className="contact-form__label">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                className="contact-form__input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="contact-form__field">
              <label htmlFor="contact-message" className="contact-form__label">
                Message
              </label>
              <textarea
                id="contact-message"
                className="contact-form__input contact-form__textarea"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="What would you like to talk about?"
                rows={5}
                required
              />
            </div>

            <button
              type="submit"
              className="contact-form__submit"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Sending…' : status === 'success' ? 'Sent ✓' : 'Send message'}
            </button>

            {status === 'success' && (
              <p className="contact-form__status contact-form__status--success">
                Message sent! I'll get back to you soon — or reach me directly at kenjisison2@gmail.com
              </p>
            )}
            {status === 'error' && (
              <p className="contact-form__status contact-form__status--error">
                Something went wrong. Please email me directly at kenjisison2@gmail.com
              </p>
            )}
          </form>
        </div>
      </div>

      <footer className="contact-footer">
        <div className="container">
          <p className="contact-footer__text">
            Built with React, D3.js, and SQLite (sql.js). © {new Date().getFullYear()} Kenji Sison.
          </p>
        </div>
      </footer>
    </section>
  );
}