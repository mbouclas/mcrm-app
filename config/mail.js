module.exports = {
  from: {
    mail: 'mailer@mcrm.io',
    name: 'Mailer'
  },
  adminEmail: {
    mail: 'mailer@mcrm.io',
    name: 'Mailer'
  },
  contactForm: {
    subject: 'New contact form submission',
  },
  address: "info@listinglink.com.cy",
  provider: "mailjet",
  mailgun : {
    domain: "env.MAILGUN_DOMAIN",
    secret: "env.MAILGUN_SECRET"
  }
}
