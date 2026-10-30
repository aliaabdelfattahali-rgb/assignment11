import { emailFormat } from "../modules/User/user.validation.js";

export function validateBody(body, schema) {
  const data = body || {};
  const errors = [];

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];

    if ((value === undefined || value === null || value === "") && rule.required) {
      errors.push(`${field} is required`);
      continue;
    }
    if (value === undefined || value === null || value === "") continue;

    if (rule.type && typeof value !== rule.type) {
      errors.push(`${field} must be a ${rule.type}`);
      continue;
    }

    if (rule.minLength && String(value).trim().length < rule.minLength) {
      errors.push(`${field} must be at least ${rule.minLength} characters`);
    }

    if (rule.format === "email" && !emailFormat.test(String(value))) {
      errors.push("Please provide a valid email");
    }

    if (rule.matches && value !== data[rule.matches]) {
      errors.push("Passwords do not match");
    }
  }

  return errors.length ? errors[0] : null;
}

export function validate(schema) {
  return (req, res, next) => {
    const message = validateBody(req.body, schema);
    if (message) {
      return res.status(400).json({ success: false, message });
    }
    next();
  };
}
