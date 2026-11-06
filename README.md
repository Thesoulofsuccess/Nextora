# Nextora Technologies — website

One responsive site that adapts from desktop to tablet to phone. Plain HTML, CSS and JavaScript with no build step, plus two small PHP files for the forms. It runs as-is on Hostinger shared hosting.

## What's inside

```
index.html            Homepage (all sections)
privacy.html          Privacy notice linked from the forms and footer
404.html              Not-found page
assets/css/style.css  All styles (design tokens at the top)
assets/js/main.js     Menus, hero animation, panels, capabilities, forms
assets/img/           Logo files, client logos, photos, brochure previews, share image
api/lead.php          Receives both forms, emails the lead, logs it to private/leads.csv
download.php          Serves the brochure only after the profile form is completed
private/              Brochure PDF + leads log. Locked by private/.htaccess (no direct access)
.htaccess             HTTPS redirect, security headers, caching, 404 page
robots.txt, sitemap.xml, favicon.png, apple-touch-icon.png
```

## Deploy: GitHub → Hostinger

1. **Create a private GitHub repository** (for example `nextora-website`). Keep it **private**, because the brochure PDF lives in `private/`. If the repo were public, anyone could download the brochure from GitHub and skip the form.
2. **Put these files at the root of the repository**, not inside a sub-folder. Hostinger deploys the repository root into your website folder, so `index.html` must sit at the top level of the repo.
   ```
   cd nextora-website
   git init
   git add .
   git commit -m "Nextora website v1"
   git branch -M main
   git remote add origin https://github.com/<your-account>/nextora-website.git
   git push -u origin main
   ```
3. **In hPanel**, go to Websites → your domain → Manage → Advanced → **GIT**.
   - Repository: `https://github.com/<your-account>/nextora-website.git`. For a private repo, Hostinger shows an SSH key; add it to GitHub under the repo's Settings → Deploy keys and use the `git@github.com:...` address instead.
   - Branch: `main`. Leave the directory **empty** to deploy into `public_html`.
   - `public_html` must be empty before the first deploy. Back up and remove the old site's files first.
   - Click **Deploy**. Turn on **Auto Deployment** to copy its webhook URL into GitHub (Settings → Webhooks), so every push updates the live site.
4. **Create the sending mailbox.** In hPanel → Emails, create `website@nextoratechnologies.com`. The forms send from this address to `info@nextoratechnologies.com`. Both addresses can be changed at the top of `api/lead.php`.
5. **Check SSL.** In hPanel → Security → SSL, make sure the certificate is active. `.htaccess` already redirects to HTTPS.

**Quick alternative without GitHub:** in hPanel → File Manager → `public_html`, upload the zip and choose Extract. Then move the contents out of the `nextora-website` folder so `index.html` sits directly in `public_html`.

## After going live: test these

- Submit the contact form. An email should arrive at info@, and a row should appear in `private/leads.csv`.
- Click "Get the business profile". Fill in the form and the PDF should download.
- Visit `/download.php` in a private window without filling in the form. It should send you back to the form.
- Visit `/private/Nextora-Business-Profile-2026.pdf` directly. It should be refused (403).

**Leads log:** `private/leads.csv` keeps every enquiry and brochure request, even if an email fails. Download it from File Manager. It is git-ignored, so it never goes back to GitHub.

**If emails don't arrive:** check the spam folder first, and make sure the `website@` mailbox exists. If your domain's email is hosted somewhere other than Hostinger, ask Hostinger support to confirm the SPF record allows their servers to send. Moving to authenticated SMTP is a small change to `api/lead.php`.

## Editing content

- All copy is in `index.html`. Capability details (the seven outcomes) are in `assets/js/main.js` under `CAPS`.
- After changing CSS or JS, bump `?v=1` to `?v=2` in `index.html` so browsers pick up the new files.
- Colours, type and spacing are CSS variables at the top of `style.css`.

## Before launch: replace or confirm

- **Photos** in `assets/img/photos/` are low-resolution previews of AI-generated images. Replace them with the full-size Canva downloads or, better, real photography of the Nextora team and client sites, using the same file names.
- **Client logos** in `assets/img/clients/` were cropped from the old website. Replace them with the clients' original files, and confirm written permission to show each logo and quote.
- **Privacy notice** (`privacy.html`): a plain-language starting point. Have it reviewed before launch.
- **Terms & conditions**: not included. Add a page if you need one and link it in the footer.
- **Share image** (`assets/img/og-image.jpg`): a simple logo card. Swap in a designed one if you like.
