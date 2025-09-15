# CSS `Content-Type` header configuration

To ensure the accessibility stylesheet is downloaded correctly by every browser, the hosting environment must explicitly return `Content-Type: text/css` for every `.css` asset. Use the examples below for the most common providers used by the project.

## Nginx

Add the rule below inside your site configuration (e.g. inside the `server` block). It keeps the default MIME map and forces `text/css` for every CSS response.

```nginx
include       mime.types;
default_type  application/octet-stream;

location ~* \.css$ {
    types { text/css css; }
    add_header Content-Type "text/css; charset=utf-8" always;
}
```

Reload Nginx after applying the change:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Vercel

Create or update `vercel.json` in the repository with the following snippet so every deployment serves CSS files with the correct header.

```json
{
  "headers": [
    {
      "source": "/(.*)\\.css",
      "headers": [
        { "key": "Content-Type", "value": "text/css; charset=utf-8" }
      ]
    }
  ]
}
```

## Lovable

In the Lovable dashboard, open **Settings → Custom headers** and add a new rule with the options below:

- **Path**: `/assets/styles/*.css`
- **Header**: `Content-Type`
- **Value**: `text/css; charset=utf-8`

Publish the deployment after saving the rule.

## Manual validation

After deploying, open `https://<host>/assets/styles/accessibility.css` in the browser (or run `curl -I https://<host>/assets/styles/accessibility.css`) and confirm the response contains `Content-Type: text/css` and the expected stylesheet body.
