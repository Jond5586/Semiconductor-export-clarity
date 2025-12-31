# Static Site Deployment

This directory contains a completely static version of the Semiconductor Export Clarity website, ready to deploy to any static hosting platform.

## Contents
- `index.html` - Complete responsive website
- `README.md` - Project documentation

## Deployment Options

### Option 1: GitHub Pages (Free, Recommended)
1. Create a new repository or use existing one
2. Upload `index.html` to the root or `/docs` folder
3. Enable GitHub Pages in repository settings
4. Your site will be live at `https://yourusername.github.io/repo-name`

**Note on Forms:** The contact form uses Formspree (free tier). To enable form submissions:
1. Visit https://formspree.io and create a free account
2. Get your form ID
3. Replace `YOUR_FORM_ID` in the form action with your actual ID
4. Test submission

### Option 2: Netlify (Free Tier Available)
1. Sign up at https://netlify.com
2. Drag and drop the `index.html` file
3. Your site goes live instantly

### Option 3: Vercel (Free Tier Available)
1. Sign up at https://vercel.com
2. Import your repository
3. Deploy with one click

### Option 4: Any Static Hosting
- Amazon S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps
- Cloudflare Pages
- etc.

## Setup Formspree for Form Handling

The form is configured to work with Formspree (free email form service):

1. Go to https://formspree.io
2. Sign up for free
3. Create a new form and get the form ID
4. Edit `index.html` and replace `YOUR_FORM_ID` in this line:
   ```html
   <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```
5. When someone submits the form, you'll receive an email with their submission

## No Backend Required
This is a completely static site - no server, database, or backend code needed. All you need is:
- Static file hosting
- (Optional) Form handler like Formspree for contact form

Deploy anywhere static sites are supported!

