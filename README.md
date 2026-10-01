# Group Services

A static, no-build dashboard that lists the group's projects: what they are, who to contact, and where the code and docs live.

Everything shown comes from [`services.yaml`](services.yaml).

## Run locally

The page loads `services.yaml` with `fetch`, so it has to be served over HTTP. Opening `index.html` directly (`file://`) won't work.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Add or edit a project

Add an entry under `projects:` in `services.yaml`. Only `name` is required:

```yaml
- id: my-service
  name: My Service
  logo: logos/my-service.svg     # URL or local path; initials are shown if omitted
  description: What it does.
  tags: [api]
  website: https://...
  docs: https://...
  contacts:
    - name: Jane Doe
      role: Maintainer
      email: jane@example.org
      chat: https://...          # optional Slack/Teams/Matrix link
  repositories:
    - name: my-service
      url: https://gitlab.example.org/group/my-service
      provider: gitlab           # optional, inferred from the URL host otherwise
  links:
    - label: Production
      url: https://...
```

`services.schema.json` describes every field. With the VS Code YAML extension (Red Hat), the `# yaml-language-server` line at the top of `services.yaml` turns on autocomplete and validation while you edit.

## Why YAML

The file is written by hand, so YAML is easier to work with than JSON: it allows comments, needs less punctuation, and gives cleaner diffs. The JSON Schema still gives you the strict validation you'd get with JSON.

## Deploy

It's static files, so any static host works: GitHub Pages, GitLab Pages, or nginx.
