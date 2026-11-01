export const vulnerabilities = [
  {
    id: 1,
    severity: "Critical",
    rule: "SQL Injection",
    file: "src/services/UserService.js",
    status: "Open",
  },
  {
    id: 2,
    severity: "High",
    rule: "Hardcoded Secret",
    file: ".env",
    status: "Open",
  },
  {
    id: 3,
    severity: "Medium",
    rule: "Weak Crypto",
    file: "src/auth/auth.js",
    status: "Mitigated",
  },
  {
    id: 4,
    severity: "Low",
    rule: "Debug Enabled",
    file: "config.js",
    status: "Open",
  },
];