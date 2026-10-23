# JayOd Studios Portfolio Website

A modern, responsive portfolio website for JayOd Studios - a professional web development business.

## Features

- **Responsive Design**: Fully responsive and mobile-friendly
- **Modern UI**: Clean, professional design with smooth animations
- **Interactive Elements**: Smooth scrolling, animated sections, and interactive navigation
- **Contact Form**: Built-in contact form with validation
- **Performance Optimized**: Fast loading with optimized assets
- **Accessible**: WCAG-compliant semantic HTML

## Sections

1. **Hero**: Eye-catching landing section with call-to-action buttons
2. **Services**: Showcases six core services offered
3. **Portfolio**: Displays recent projects with technology tags
4. **About**: Company information and statistics
5. **Contact**: Contact form and business information
6. **Footer**: Links and social media connections

## Customization

### Colors
Edit the CSS variables in `styles.css` to match your brand:

```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #1e40af;
    --accent-color: #60a5fa;
}
```

### Content
- **Contact Information**: Update email, phone, and location in `index.html` (Contact Section)
- **Statistics**: Modify the numbers in the About Section
- **Portfolio Items**: Replace placeholder projects with your actual work
- **Services**: Customize the six service cards to match your offerings

### Images
Replace the placeholder portfolio images by:
1. Adding your project images to an `images` folder
2. Updating the `.portfolio-image` divs with actual `<img>` tags

## Technologies Used

- HTML5
- CSS3 (with CSS Grid and Flexbox)
- Vanilla JavaScript
- No external dependencies

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Setup

1. Open `index.html` in a web browser to view locally
2. For production, host on any web server or static hosting service:
   - Netlify
   - Vercel
   - GitHub Pages
   - AWS S3
   - Any traditional web host

## Form Integration

The contact form currently displays a success message. To make it functional:

1. **Email Service Integration**:
   - Use [Formspree](https://formspree.io/)
   - Use [EmailJS](https://www.emailjs.com/)
   - Use [Web3Forms](https://web3forms.com/)

2. **Backend Integration**:
   - Create a server endpoint to process form submissions
   - Update the form submission handler in `script.js`

## Next Steps

1. Add your actual portfolio projects with images
2. Update contact information with your real details
3. Connect the contact form to an email service
4. Add your social media links
5. Consider adding a blog section
6. Implement Google Analytics or similar tracking
7. Add meta tags for better SEO

## License

Feel free to customize and use this template for your business.
