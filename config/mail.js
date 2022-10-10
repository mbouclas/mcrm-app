module.exports = {
  address: "info@listinglink.com.cy",
  from: "The ListingLink Team",
  provider: "mailgun",
  mailgun : {
    domain: "env.MAILGUN_DOMAIN",
    secret: "env.MAILGUN_SECRET"
  }
}
