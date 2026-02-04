const crypto = require("crypto");

exports.hashData = (data) => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

exports.signHash = (hash, privateKeyPem) => {
  return crypto.sign(
    "sha256",
    Buffer.from(hash),
    privateKeyPem
  ).toString("base64");
};

exports.verifySignature = (hash, signature, publicKeyPem) => {
  return crypto.verify(
    "sha256",
    Buffer.from(hash),
    publicKeyPem,
    Buffer.from(signature, "base64")
  );
};
