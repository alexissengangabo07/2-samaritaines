const DATE_EXPIRATION = new Date("2026-11-27T11:59:59");

function estExpire() {
  return new Date() > DATE_EXPIRATION;
}

module.exports = { DATE_EXPIRATION, estExpire };
