import { Translations, Translation, TranslationKey, GenerationMode, Settings, Shortcut, ShortcutAction, SettingsTab } from './types';

export const DEV_MODE_ACTIVATION_CODE = '152007';

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: 'def-1', keys: 'Ctrl+N', action: 'newChat', isEditable: true, isDeletable: false },
  { id: 'def-2', keys: 'Escape', action: 'stopGeneration', isEditable: true, isDeletable: false },
  { id: 'def-3', keys: 'Ctrl+K', action: 'openSearch', isEditable: true, isDeletable: false },
  { id: 'def-4', keys: 'Ctrl+L', action: 'openLibrary', isEditable: true, isDeletable: false },
  { id: 'def-5', keys: 'Ctrl+,', action: 'openSettings', isEditable: true, isDeletable: false },
  { id: 'def-6', keys: 'Ctrl+B', action: 'toggleSidebar', isEditable: true, isDeletable: false },
];

export const AVAILABLE_SHORTCUT_ACTIONS: { action: ShortcutAction; labelKey: TranslationKey, icon: string }[] = [
    // Basic
    { action: 'newChat', labelKey: 'newChatShortcut', icon: 'plus-square' },
    { action: 'stopGeneration', labelKey: 'stopGenerationShortcut', icon: 'square' },
    { action: 'focusInput', labelKey: 'focusInputShortcut', icon: 'edit' },
    // Navigation
    { action: 'openSearch', labelKey: 'searchShortcut', icon: 'search' },
    { action: 'openLibrary', labelKey: 'openLibraryShortcut', icon: 'library' },
    { action: 'openSettings', labelKey: 'openSettingsShortcut', icon: 'settings' },
    { action: 'toggleSidebar', labelKey: 'toggleSidebarShortcut', icon: 'panel-left' },
    { action: 'nextChat', labelKey: 'nextChatShortcut', icon: 'arrow-down' },
    { action: 'previousChat', labelKey: 'previousChatShortcut', icon: 'arrow-up' },
    // UI
    { action: 'toggleTheme', labelKey: 'toggleThemeShortcut', icon: 'sun-moon' },
    { action: 'increaseTextScale', labelKey: 'increaseTextScaleShortcut', icon: 'zoom-in' },
    { action: 'decreaseTextScale', labelKey: 'decreaseTextScaleShortcut', icon: 'zoom-out' },
    { action: 'resetTextScale', labelKey: 'resetTextScaleShortcut', icon: 'circle-dot' },
    // Chat Actions
    { action: 'copyLastMessage', labelKey: 'copyLastMessageShortcut', icon: 'copy' },
    { action: 'regenerateLastResponse', labelKey: 'regenerateLastResponseShortcut', icon: 'refresh-cw' },
    { action: 'clearChat', labelKey: 'clearChatShortcut', icon: 'trash-2' },
    { action: 'pinChat', labelKey: 'pinChatShortcut', icon: 'pin' },
    { action: 'archiveChat', labelKey: 'archiveChatShortcut', icon: 'archive' },
    // Modals
    { action: 'openSubscription', labelKey: 'openSubscriptionShortcut', icon: 'credit-card' },
    { action: 'openAiTools', labelKey: 'openAiToolsShortcut', icon: 'sliders-horizontal' },
    { action: 'openMediaAttachments', labelKey: 'openMediaAttachmentsShortcut', icon: 'paperclip' },
];

export const SETTINGS_TABS: { id: SettingsTab; labelKey: TranslationKey }[] = [
    { id: 'general', labelKey: 'general' },
    { id: 'personal', labelKey: 'personal' },
    { id: 'ai', labelKey: 'ai' },
    { id: 'preview', labelKey: 'preview' },
    { id: 'subscription', labelKey: 'subscription' },
    { id: 'account', labelKey: 'account' },
    { id: 'data', labelKey: 'data' },
    { id: 'lab', labelKey: 'lab' },
    { id: 'help', labelKey: 'help' },
    { id: 'about', labelKey: 'about' },
    { id: 'shortcuts', labelKey: 'keyboardShortcuts' },
];

export const MESSAGE_REPORT_CATEGORIES: { [key: string]: { titleKey: TranslationKey; reasons: TranslationKey[] } } = {
    harmful: {
        titleKey: 'reportCat_harmful',
        reasons: ['reportReason_hateSpeech', 'reportReason_harassment', 'reportReason_dangerous', 'reportReason_other'],
    },
    incorrect: {
        titleKey: 'reportCat_incorrectInfo',
        reasons: ['reportReason_factuallyIncorrect', 'reportReason_codeErrors', 'reportReason_hallucination', 'reportReason_incompleteResponse', 'reportReason_other'],
    },
    notFollowing: {
        titleKey: 'reportCat_notFollowInstructions',
        reasons: ['reportReason_ignoredPrompt', 'reportReason_badFormatting', 'reportReason_wrongLanguage', 'reportReason_other'],
    },
     spam: {
        titleKey: 'reportCat_spam',
        reasons: ['reportReason_spam', 'reportReason_offTopic', 'reportReason_other'],
    },
};

export const CHAT_REPORT_CATEGORIES: { [key: string]: { titleKey: TranslationKey; reasons: TranslationKey[] } } = {
    flow: {
        titleKey: 'reportCat_problematicFlow',
        reasons: ['reportReason_stuckInLoop', 'reportReason_losesContext', 'reportReason_incoherent', 'reportReason_other'],
    },
    tone: {
        titleKey: 'reportCat_unhelpfulTone',
        reasons: ['reportReason_refusesRequests', 'isRude', 'reportReason_genericAnswers', 'reportReason_other'],
    },
    security: {
        titleKey: 'reportCat_securityPrivacy',
        reasons: ['reportReason_asksSensitiveInfo', 'reportReason_insecureCode', 'reportReason_potentialDataLeak', 'reportReason_other'],
    },
};

export const TEMPLATE_REPORT_CATEGORIES: { [key: string]: { titleKey: TranslationKey; reasons: TranslationKey[] } } = {
    quality: {
        titleKey: 'reportCat_lowQualityTemplate',
        reasons: ['reportReason_templateOutdatedCode', 'reportReason_templateUnappealing', 'reportReason_templateNotResponsive', 'reportReason_other'],
    },
    misleading: {
        titleKey: 'reportCat_misleadingTemplate',
        reasons: ['reportReason_templateBadDescription', 'reportReason_templateHasErrors', 'reportReason_templateNotWorking', 'reportReason_other'],
    },
    harmful: {
        titleKey: 'reportCat_harmfulTemplate',
        reasons: ['reportReason_templateInsecureCode', 'reportReason_templateDangerous', 'reportReason_other'],
    },
};

export const SPACE_ICONS = [
    'folder-kanban', 'layout-grid', 'box', 'briefcase', 'database', 'cloud', 
    'book-open', 'star', 'rocket', 'code', 'smartphone', 'server', 'file-text', 
    'image', 'video', 'music', 'globe', 'compass', 'cpu', 'shield', 'flag', 
    'palette', 'graduation-cap', 'lightbulb', 'home', 'user', 'users', 'message-square',
    'shopping-cart', 'credit-card', 'dollar-sign', 'trending-up', 'award', 'camera'
];

export const SPACE_COLORS = [
    { name: 'Default', key: 'default', class: 'bg-slate-500', text: 'text-white', ring: 'ring-slate-400' },
    { name: 'Blue', key: 'blue', class: 'bg-blue-500', text: 'text-white', ring: 'ring-blue-300' },
    { name: 'Green', key: 'green', class: 'bg-green-500', text: 'text-white', ring: 'ring-green-300' },
    { name: 'Red', key: 'red', class: 'bg-red-500', text: 'text-white', ring: 'ring-red-300' },
    { name: 'Purple', key: 'purple', class: 'bg-purple-500', text: 'text-white', ring: 'ring-purple-300' },
    { name: 'Yellow', key: 'yellow', class: 'bg-yellow-500', text: 'text-white', ring: 'ring-yellow-300' },
    { name: 'Pink', key: 'pink', class: 'bg-pink-500', text: 'text-white', ring: 'ring-pink-300' },
    { name: 'Gray', key: 'gray', class: 'bg-gray-500', text: 'text-white', ring: 'ring-gray-300' },
];

export const projectTemplates: (Omit<any, 'type' | 'generationMode' | 'titleKey' | 'descriptionKey' | 'promptKey'> & { type: 'HTML' | 'JavaScript' | 'Android'; generationMode: GenerationMode; titleKey: TranslationKey; descriptionKey: TranslationKey; promptKey: TranslationKey; })[] = [
    {
      id: 'template_portfolio',
      type: 'HTML',
      generationMode: 'code_generation',
      icon: 'briefcase',
      titleKey: 'template_portfolio_title',
      descriptionKey: 'template_portfolio_desc',
      promptKey: 'template_portfolio_prompt',
      design: 'portfolio',
      content: {
        htmlContent: `<!DOCTYPE html>
<html lang="en" style="scroll-behavior: smooth;">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>John Doe - Web Developer</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #3B82F6; /* blue-500 */
            --secondary-color: #1F2937; /* gray-800 */
            --bg-light: #F9FAFB; /* gray-50 */
            --text-dark: #1F2937;
        }
        body {
            font-family: 'Poppins', sans-serif;
            margin: 0;
            background-color: var(--bg-light);
            color: var(--text-dark);
            line-height: 1.6;
        }
        .container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 0 2rem;
        }
        header {
            background-color: #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            position: sticky;
            top: 0;
            z-index: 10;
        }
        nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 0;
        }
        .logo {
            font-weight: 700;
            font-size: 1.5rem;
            color: var(--primary-color);
        }
        .nav-links {
            list-style: none;
            display: flex;
            gap: 2rem;
            margin: 0;
            padding: 0;
        }
        .nav-links a {
            text-decoration: none;
            color: var(--secondary-color);
            font-weight: 600;
            transition: color 0.2s;
        }
        .nav-links a:hover {
            color: var(--primary-color);
        }
        section {
            padding: 5rem 0;
        }
        .hero {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 2rem;
            min-height: 80vh;
        }
        .hero-text { flex: 1; }
        .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
        .hero p { font-size: 1.1rem; color: #4B5563; margin-bottom: 2rem; }
        .hero-image { flex: 1; text-align: center; }
        .hero-image img {
            max-width: 80%;
            height: auto;
            border-radius: 50%;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .cta-button {
            display: inline-block;
            background-color: var(--primary-color);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
        }
        .section-title {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 3rem;
        }
        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        .project-card {
            background-color: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .project-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 20px rgba(0,0,0,0.1);
        }
        .project-card img { width: 100%; height: 200px; object-fit: cover; }
        .project-info { padding: 1.5rem; }
        .project-info h3 { margin-top: 0; color: var(--secondary-color); }
        .project-info a { color: var(--primary-color); text-decoration: none; font-weight: 600; }
        #contact form {
            max-width: 600px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        #contact input, #contact textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #D1D5DB;
            border-radius: 8px;
            font-family: 'Poppins', sans-serif;
        }
        footer {
            background-color: var(--secondary-color);
            color: #F9FAFB;
            text-align: center;
            padding: 2rem 0;
        }
        @media (max-width: 768px) {
            .hero { flex-direction: column; text-align: center; }
            .nav-links { display: none; }
            .hero h1 { font-size: 2.5rem; }
        }
    </style>
</head>
<body>
    <header>
        <nav class="container">
            <a href="#" class="logo">JD</a>
            <ul class="nav-links">
                <li><a href="#about">About</a></li>
                <li><a href="#projects">Projects</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    <main>
        <section id="about" class="hero container">
            <div class="hero-text">
                <h1>Hi, I'm John Doe</h1>
                <p>A passionate Web Developer creating modern and responsive web applications. I turn ideas into interactive digital experiences.</p>
                <a href="#projects" class="cta-button">View My Work</a>
            </div>
            <div class="hero-image">
                <img src="https://i.pravatar.cc/300" alt="John Doe">
            </div>
        </section>
        <section id="projects">
            <div class="container">
                <h2 class="section-title">My Projects</h2>
                <div class="projects-grid">
                    <div class="project-card">
                        <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400" alt="Project 1">
                        <div class="project-info">
                            <h3>E-commerce Platform</h3>
                            <p>A full-featured online store built with modern web technologies for a seamless shopping experience.</p>
                            <a href="#">View Demo</a>
                        </div>
                    </div>
                    <div class="project-card">
                        <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400" alt="Project 2">
                        <div class="project-info">
                            <h3>Data Dashboard</h3>
                            <p>An interactive dashboard for visualizing complex data sets, helping businesses make informed decisions.</p>
                            <a href="#">View Demo</a>
                        </div>
                    </div>
                    <div class="project-card">
                        <img src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400" alt="Project 3">
                        <div class="project-info">
                            <h3>Blogging CMS</h3>
                            <p>A content management system that allows users to easily create, edit, and publish blog posts.</p>
                            <a href="#">View Demo</a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <section id="contact" style="background-color: #fff;">
            <div class="container">
                <h2 class="section-title">Get In Touch</h2>
                <form>
                    <input type="text" placeholder="Your Name" required>
                    <input type="email" placeholder="Your Email" required>
                    <textarea placeholder="Your Message" rows="5" required></textarea>
                    <button type="submit" class="cta-button" style="align-self: center;">Send Message</button>
                </form>
            </div>
        </section>
    </main>
    <footer>
        <div class="container">
            <p>&copy; 2024 John Doe. All Rights Reserved.</p>
        </div>
    </footer>
</body>
</html>`,
      },
    },
    {
      id: 'template_landing_page',
      type: 'HTML',
      generationMode: 'code_generation',
      icon: 'rocket',
      titleKey: 'template_landing_page_title',
      descriptionKey: 'template_landing_page_desc',
      promptKey: 'template_landing_page_prompt',
      design: 'landing',
      content: {
        htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SaaSify - Awesome Landing Page</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; margin: 0; background-color: #111827; color: #F3F4F6; }
        .container { max-width: 1200px; margin: auto; padding: 0 2rem; }
        .hero { text-align: center; padding: 8rem 1rem; }
        .hero h1 { font-size: 4rem; font-weight: 800; margin-bottom: 1rem; background: -webkit-linear-gradient(45deg, #3B82F6, #A78BFA); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero p { font-size: 1.25rem; color: #9CA3AF; max-width: 600px; margin: 0 auto 2rem auto; }
        .cta-button { background: linear-gradient(to right, #3B82F6, #8B5CF6); color: white; padding: 1rem 2rem; border-radius: 50px; text-decoration: none; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; display: inline-block; }
        .cta-button:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3); }
        .features { padding: 5rem 0; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; }
        .feature-card { background: #1F2937; padding: 2rem; border-radius: 12px; text-align: center; border: 1px solid #374151; }
        footer { padding: 4rem 0; text-align: center; color: #6B7280; }
        @media (max-width: 768px) { .hero h1 { font-size: 3rem; } }
    </style>
</head>
<body>
    <section class="hero">
        <h1>Launch Your Next Big Idea</h1>
        <p>SaaSify provides the building blocks for modern software. Focus on your product, not the boilerplate.</p>
        <a href="#" class="cta-button">Get Started For Free</a>
    </section>
    <section class="features container">
        <div class="features-grid">
            <div class="feature-card"><h3>Feature One</h3><p>Powerful and extensible for any use case.</p></div>
            <div class="feature-card"><h3>Feature Two</h3><p>Designed for developers with clean APIs.</p></div>
            <div class="feature-card"><h3>Feature Three</h3><p>Blazing fast performance on a global scale.</p></div>
        </div>
    </section>
    <footer><p>&copy; 2024 SaaSify. All rights reserved.</p></footer>
</body>
</html>`,
      },
    },
    {
      id: 'template_blog_post',
      type: 'HTML',
      generationMode: 'code_generation',
      icon: 'file-text',
      titleKey: 'template_blog_post_title',
      descriptionKey: 'template_blog_post_desc',
      promptKey: 'template_blog_post_prompt',
      design: 'blog',
      content: {
        htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Art of Modern Web Design</title>
    <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=Roboto:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Roboto', sans-serif; line-height: 1.7; color: #333; background: #fdfdfd; }
        .container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
        article h1 { font-family: 'Lora', serif; font-size: 2.8rem; margin-bottom: 0.5rem; }
        .meta { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
        .featured-image { width: 100%; height: auto; border-radius: 8px; margin-bottom: 2rem; }
        article p, article ul { margin-bottom: 1.5rem; }
        article code { background: #eee; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; }
        blockquote { border-left: 4px solid #ccc; margin: 1.5rem 0; padding-left: 1rem; font-style: italic; }
        @media (max-width: 768px) { article h1 { font-size: 2.2rem; } }
    </style>
</head>
<body>
    <div class="container">
        <article>
            <header>
                <h1>The Art of Modern Web Design</h1>
                <p class="meta">Published on July 26, 2024 by Jane Smith</p>
            </header>
            <img class="featured-image" src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800" alt="Laptop with code on screen">
            <p>Web design is an ever-evolving field. What was considered best practice five years ago might be outdated today. This post explores some core principles of modern design that stand the test of time.</p>
            <h2>1. Simplicity and Minimalism</h2>
            <p>Less is often more. A clean, uncluttered interface allows the user to focus on the content. Whitespace is not empty space; it's a powerful design tool to improve readability and create a sense of calm.</p>
            <blockquote>"Simplicity is the ultimate sophistication." - Leonardo da Vinci</blockquote>
            <h2>2. Responsive Design</h2>
            <p>With users accessing the web from a multitude of devices, your site must look and function flawlessly on all of them. Using flexible grids and media queries is essential. For example, the CSS rule <code>display: grid;</code> is incredibly powerful for creating responsive layouts.</p>
        </article>
    </div>
</body>
</html>`,
      },
    },
    {
      id: 'template_login_form',
      type: 'HTML',
      generationMode: 'code_generation',
      icon: 'log-in',
      titleKey: 'template_login_form_title',
      descriptionKey: 'template_login_form_desc',
      promptKey: 'template_login_form_prompt',
      design: 'login',
      content: {
        htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login to Your Account</title>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f3f4f6; font-family: 'Nunito', sans-serif; }
        .login-card { background: white; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
        h2 { text-align: center; font-size: 1.8rem; font-weight: 700; color: #1f2937; }
        .form-group { margin-bottom: 1.5rem; }
        label { font-weight: 600; color: #4b5569; }
        input { width: 100%; padding: 0.75rem 1rem; margin-top: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.5rem; box-sizing: border-box; }
        button { width: 100%; padding: 0.8rem; background-color: #3b82f6; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 700; }
    </style>
</head>
<body>
    <div class="login-card">
        <h2>Welcome Back!</h2>
        <form>
            <div class="form-group"><label for="email">Email</label><input type="email" id="email" required></div>
            <div class="form-group"><label for="password">Password</label><input type="password" id="password" required></div>
            <button type="submit">Log In</button>
        </form>
    </div>
</body>
</html>`,
      },
    },
    {
      id: 'template_survey_form',
      type: 'HTML',
      generationMode: 'code_generation',
      icon: 'file-check-2',
      titleKey: 'template_survey_form_title',
      descriptionKey: 'template_survey_form_desc',
      promptKey: 'template_survey_form_prompt',
      design: 'survey',
      content: {
        htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Feedback Survey</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f4f4f9; color: #333; display: grid; place-items: center; min-height: 100vh; padding: 20px;}
        .survey-container { width: 100%; max-width: 600px; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        h2 { text-align: center; margin-top: 0; }
        .form-group { margin-bottom: 25px; }
        label { display: block; margin-bottom: 8px; font-weight: bold; }
        input[type="text"], input[type="email"], textarea, select { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; }
        .radio-group label { display: flex; align-items: center; gap: 10px; font-weight: normal; }
        button { background-color: #5c67f2; color: white; padding: 12px 20px; border: none; border-radius: 5px; cursor: pointer; width: 100%; font-size: 16px; }
    </style>
</head>
<body>
    <div class="survey-container">
        <h2>We Value Your Feedback!</h2>
        <form>
            <div class="form-group"><label for="name">Name</label><input type="text" id="name" required></div>
            <div class="form-group"><label for="email">Email</label><input type="email" id="email" required></div>
            <div class="form-group"><label>How would you rate our service?</label>
                <div class="radio-group"><label><input type="radio" name="rating" value="excellent">Excellent</label></div>
                <div class="radio-group"><label><input type="radio" name="rating" value="good">Good</label></div>
                <div class="radio-group"><label><input type="radio" name="rating" value="poor">Poor</label></div>
            </div>
            <div class="form-group"><label for="comments">Any comments or suggestions?</label><textarea id="comments" rows="4"></textarea></div>
            <button type="submit">Submit Feedback</button>
        </form>
    </div>
</body>
</html>`,
      },
    },
    {
      id: 'template_product_card',
      type: 'HTML',
      generationMode: 'code_generation',
      icon: 'shopping-cart',
      titleKey: 'template_product_card_title',
      descriptionKey: 'template_product_card_desc',
      promptKey: 'template_product_card_prompt',
      design: 'product',
      content: {
        htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Product Card</title>
    <style>
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color:#f0f2f5; font-family: 'Segoe UI', sans-serif; }
        .product-card { width: 320px; background: #fff; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden; transition: all 0.3s ease; }
        .product-card:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.15); }
        .product-image-container { position: relative; }
        .product-image { width: 100%; height: 220px; object-fit: cover; }
        .product-info { padding: 25px; }
        .product-title { font-size: 1.3rem; font-weight: bold; margin: 0 0 10px 0; }
        .product-price { font-size: 1.6rem; color: #e91e63; margin: 10px 0; font-weight: bold; }
        .add-to-cart-btn { display: block; width: 100%; padding: 12px; background-color: #2196f3; color: white; text-align: center; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: background-color 0.2s; }
        .add-to-cart-btn:hover { background-color: #1976d2; }
    </style>
</head>
<body>
    <div class="product-card">
        <div class="product-image-container"><img src="https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=320" alt="Product" class="product-image"></div>
        <div class="product-info">
            <h3 class="product-title">Premium Organic Oil</h3>
            <p>High-quality, cold-pressed oil for skin and hair.</p>
            <p class="product-price">$29.99</p>
            <button class="add-to-cart-btn">Add to Cart</button>
        </div>
    </div>
</body>
</html>`,
      },
    },
    {
      id: 'template_image_gallery',
      type: 'HTML',
      generationMode: 'code_generation',
      icon: 'gallery-vertical',
      titleKey: 'template_image_gallery_title',
      descriptionKey: 'template_image_gallery_desc',
      promptKey: 'template_image_gallery_prompt',
      content: {
        htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Responsive Image Gallery</title>
    <style>
        body { font-family: sans-serif; }
        .gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; padding: 15px; }
        .gallery-item { overflow: hidden; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); cursor: pointer; }
        .gallery-item img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.4s ease; }
        .gallery-item:hover img { transform: scale(1.1); }
        .lightbox { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center; }
        .lightbox img { max-width: 90%; max-height: 80%; }
        .lightbox.active { display: flex; }
    </style>
</head>
<body>
    <div class="gallery">
        <div class="gallery-item"><img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300" alt="Image 1"></div>
        <div class="gallery-item"><img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300" alt="Image 2"></div>
        <div class="gallery-item"><img src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=300" alt="Image 3"></div>
        <div class="gallery-item"><img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300" alt="Image 4"></div>
        <div class="gallery-item"><img src="https://images.unsplash.com/photo-1520085601670-ee14aa5fa3e8?w=300" alt="Image 5"></div>
        <div class="gallery-item"><img src="https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=300" alt="Image 6"></div>
    </div>
    <div class="lightbox" id="lightbox"><img src="" alt="Enlarged image"></div>
    <script>
        const galleryItems = document.querySelectorAll('.gallery-item');
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = lightbox.querySelector('img');
        
        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                lightboxImg.src = item.querySelector('img').src;
                lightbox.classList.add('active');
            });
        });
        
        lightbox.addEventListener('click', (e) => {
            if (e.target !== lightboxImg) {
                lightbox.classList.remove('active');
            }
        });
    </script>
</body>
</html>`,
      },
    },
    {
      id: 'template_restaurant_menu',
      type: 'HTML',
      generationMode: 'code_generation',
      icon: 'utensils-crossed',
      titleKey: 'template_restaurant_menu_title',
      descriptionKey: 'template_restaurant_menu_desc',
      promptKey: 'template_restaurant_menu_prompt',
      design: 'restaurant',
      content: {
        htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>The Gourmet's Table - Menu</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@400;500&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Roboto', sans-serif; background-color: #fdfaf6; color: #4a4a4a; }
        .menu-container { max-width: 800px; margin: 40px auto; padding: 40px; background: #fff; border: 1px solid #eee; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        h1 { text-align: center; font-family: 'Playfair Display', serif; color: #c0392b; margin-top: 0; }
        .menu-section { margin-top: 40px; }
        .menu-section h2 { font-family: 'Playfair Display', serif; border-bottom: 2px solid #e74c3c; padding-bottom: 10px; color: #e74c3c; }
        .menu-item { margin: 20px 0; }
        .menu-item-header { display: flex; justify-content: space-between; align-items: baseline; }
        .menu-item-name { font-weight: 500; font-size: 1.1rem; }
        .menu-item-price { font-weight: 500; color: #2c3e50; }
        .menu-item-description { font-size: 0.9rem; color: #7f8c8d; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="menu-container">
        <h1>Our Menu</h1>
        <div class="menu-section">
            <h2>Appetizers</h2>
            <div class="menu-item">
                <div class="menu-item-header"><span class="menu-item-name">Classic Bruschetta</span><span class="menu-item-price">$8</span></div>
                <p class="menu-item-description">Toasted baguette with fresh tomatoes, garlic, basil, and olive oil.</p>
            </div>
        </div>
        <div class="menu-section">
            <h2>Main Courses</h2>
            <div class="menu-item">
                <div class="menu-item-header"><span class="menu-item-name">Spaghetti Carbonara</span><span class="menu-item-price">$15</span></div>
                <p class="menu-item-description">Creamy egg-based sauce with pancetta and pecorino cheese.</p>
            </div>
        </div>
    </div>
</body>
</html>`,
      },
    },
    {
      id: 'template_admin_dashboard',
      type: 'HTML',
      generationMode: 'code_generation',
      icon: 'layout-dashboard',
      titleKey: 'template_admin_dashboard_title',
      descriptionKey: 'template_admin_dashboard_desc',
      promptKey: 'template_admin_dashboard_prompt',
      design: 'dashboard',
      content: {
        htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin Dashboard</title>
    <style>
        body { font-family: sans-serif; margin: 0; background: #f4f7fa; }
        .dashboard-layout { display: flex; height: 100vh; }
        .sidebar { width: 250px; background: #2c3e50; color: white; padding: 20px; display: flex; flex-direction: column; }
        .sidebar h2 { margin: 0 0 2rem 0; }
        .sidebar nav a { color: #bdc3c7; text-decoration: none; display: block; padding: 0.75rem 0; transition: color 0.2s; }
        .sidebar nav a:hover { color: white; }
        .main-content { flex: 1; padding: 40px; overflow-y: auto; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-card h3 { margin: 0 0 0.5rem 0; color: #7f8c8d; }
        .stat-card p { font-size: 2rem; font-weight: bold; margin: 0; }
    </style>
</head>
<body>
    <div class="dashboard-layout">
        <aside class="sidebar">
            <h2>Admin Panel</h2>
            <nav>
                <a href="#">Dashboard</a><a href="#">Users</a><a href="#">Settings</a>
            </nav>
        </aside>
        <main class="main-content">
            <h1>Dashboard</h1>
            <div class="stats-grid">
                <div class="stat-card"><h3>Users</h3><p>1,234</p></div>
                <div class="stat-card"><h3>Sales</h3><p>$56,789</p></div>
                <div class="stat-card"><h3>Tickets</h3><p>42</p></div>
            </div>
        </main>
    </div>
</body>
</html>`,
      },
    },
    {
      id: 'template_faq_accordion',
      type: 'HTML',
      generationMode: 'code_generation',
      icon: 'help-circle',
      titleKey: 'template_faq_accordion_title',
      descriptionKey: 'template_faq_accordion_desc',
      promptKey: 'template_faq_accordion_prompt',
      design: 'faq',
      content: {
        htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>FAQ Section</title>
    <style>
        body { font-family: sans-serif; background-color: #f0f0f0; padding: 2rem; }
        .accordion { max-width: 700px; margin: auto; }
        .accordion-item { border-bottom: 1px solid #ddd; }
        .accordion-button { width: 100%; background: none; border: none; text-align: left; padding: 1.25rem 1rem; font-size: 1rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
        .accordion-content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out, padding 0.3s ease-out; padding: 0 1rem; }
    </style>
</head>
<body>
    <div class="accordion">
        <div class="accordion-item">
            <button class="accordion-button">Question 1?</button>
            <div class="accordion-content"><p>Answer to question 1. This is some detail text.</p></div>
        </div>
        <div class="accordion-item">
            <button class="accordion-button">Question 2?</button>
            <div class="accordion-content"><p>Answer to question 2. More details can go here.</p></div>
        </div>
    </div>
    <script>
        document.querySelectorAll('.accordion-button').forEach(button => {
            button.addEventListener('click', () => {
                const content = button.nextElementSibling;
                button.setAttribute('aria-expanded', content.style.maxHeight ? 'false' : 'true');
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                    content.style.padding = "0 1rem";
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                    content.style.padding = "1rem";
                } 
            });
        });
    </script>
</body>
</html>`,
      },
    },
    {
      id: 'template_contact_form',
      type: 'HTML',
      generationMode: 'code_generation',
      icon: 'mail',
      titleKey: 'template_contact_form_title',
      descriptionKey: 'template_contact_form_desc',
      promptKey: 'template_contact_form_prompt',
      design: 'contact',
      content: {
        htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><title>Contact Us</title><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f3f4f6; }
        .contact-form { max-width: 500px; width: 100%; margin: auto; padding: 2rem; border: 1px solid #e5e7eb; border-radius: 10px; background-color: white; }
        h2 { text-align: center; }
        .form-group { margin-bottom: 1.25rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
        input, textarea { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; box-sizing: border-box; }
        button { width: 100%; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
    </style>
</head>
<body>
    <form class="contact-form">
        <h2>Contact Us</h2>
        <div class="form-group"><label for="name">Name</label><input type="text" id="name" required></div>
        <div class="form-group"><label for="email">Email</label><input type="email" id="email" required></div>
        <div class="form-group"><label for="message">Message</label><textarea id="message" rows="5" required></textarea></div>
        <button type="submit">Send</button>
    </form>
</body>
</html>`,
      },
    },
    {
      id: 'template_weather_widget',
      type: 'HTML',
      generationMode: 'code_generation',
      icon: 'cloud-sun',
      titleKey: 'template_weather_widget_title',
      descriptionKey: 'template_weather_widget_desc',
      promptKey: 'template_weather_widget_prompt',
      design: 'weather',
      content: {
        htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><title>Weather Widget</title><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        .weather-widget { width: 250px; padding: 20px; background: linear-gradient(to bottom, #87CEEB, #4682B4); color: white; border-radius: 15px; text-align: center; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
        .temperature { font-size: 4rem; font-weight: bold; }
        .condition { font-size: 1.5rem; }
        .details { display: flex; justify-content: space-around; margin-top: 1.5rem; }
    </style>
</head>
<body>
    <div class="weather-widget">
        <h3>New York</h3>
        <div class="temperature">68°</div>
        <div class="condition">Sunny</div>
        <div class="details">
            <div><strong>Wind</strong><p>5 mph</p></div>
            <div><strong>Humidity</strong><p>40%</p></div>
        </div>
    </div>
</body>
</html>`,
      },
    },
    {
      id: 'template_music_player',
      type: 'HTML',
      generationMode: 'code_generation',
      icon: 'music',
      titleKey: 'template_music_player_title',
      descriptionKey: 'template_music_player_desc',
      promptKey: 'template_music_player_prompt',
      design: 'music-player',
      content: {
        htmlContent: `<!DOCTYPE html>
<html><head><title>Music Player</title>
<style>
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #121212; }
    .music-player { width: 320px; background: #282828; color: #fff; padding: 20px; border-radius: 10px; }
    .song-details { text-align: center; }
    .progress-bar { width: 100%; height: 4px; background: #535353; border-radius: 2px; margin: 1rem 0; }
    .controls { display: flex; justify-content: space-around; align-items: center; margin-top: 1rem; }
    .play-btn { width: 50px; height: 50px; background: #1DB954; border-radius: 50%; border: none; display: grid; place-items: center; }
</style>
</head>
<body>
    <div class="music-player">
        <div class="song-details"><h4>Song Title</h4><p>Artist Name</p></div>
        <div class="progress-bar"></div>
        <div class="controls">
            <button>&lt;&lt;</button>
            <button class="play-btn">▶</button>
            <button>&gt;&gt;</button>
        </div>
    </div>
</body></html>`,
      },
    },
    {
      id: 'template_404_page',
      type: 'HTML',
      generationMode: 'code_generation',
      icon: 'search-x',
      titleKey: 'template_404_page_title',
      descriptionKey: 'template_404_page_desc',
      promptKey: 'template_404_page_prompt',
      design: 'error-404',
      content: {
        htmlContent: `<!DOCTYPE html>
<html><head><title>404 Not Found</title>
<style>
    body { text-align: center; padding-top: 50px; font-family: sans-serif; background: #1a202c; color: white; }
    h1 { font-size: 10rem; margin: 0; }
    a { color: #63b3ed; text-decoration: none; }
</style>
</head>
<body>
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>Sorry, the page you are looking for does not exist.</p>
    <a href="#">Go Home</a>
</body></html>`,
      },
    },
    {
      id: 'template_pricing_table',
      type: 'HTML',
      generationMode: 'code_generation',
      icon: 'tag',
      titleKey: 'template_pricing_table_title',
      descriptionKey: 'template_pricing_table_desc',
      promptKey: 'template_pricing_table_prompt',
      design: 'pricing',
      content: {
        htmlContent: `<!DOCTYPE html>
<html><head><title>Pricing Plans</title><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    body { font-family: sans-serif; background-color: #f7fafc; }
    .pricing-table { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; padding: 2rem; }
    .plan { border: 1px solid #e2e8f0; padding: 2rem; text-align: center; border-radius: 10px; background: white; width: 300px; }
    .plan.featured { border-color: #4299e1; transform: scale(1.05); }
</style>
</head>
<body>
    <div class="pricing-table">
        <div class="plan"><h3>Basic</h3><p>$10/mo</p><ul><li>Feature 1</li></ul><button>Select</button></div>
        <div class="plan featured"><h3>Pro</h3><p>$20/mo</p><ul><li>Feature 1</li><li>Feature 2</li></ul><button>Select</button></div>
        <div class="plan"><h3>Enterprise</h3><p>Contact Us</p><ul><li>All Features</li></ul><button>Select</button></div>
    </div>
</body></html>`,
      },
    },
    {
      id: 'template_digital_clock',
      type: 'JavaScript',
      generationMode: 'javascript_code_generation',
      icon: 'clock',
      titleKey: 'template_digital_clock_title',
      descriptionKey: 'template_digital_clock_desc',
      promptKey: 'template_digital_clock_prompt',
      design: 'clock',
      content: {
        text: `// This script creates a stylish, self-contained digital clock on the page.
(function() {
    const clockElement = document.createElement('div');
    Object.assign(clockElement.style, {
        fontFamily: '"Share Tech Mono", monospace', color: '#daf6ff',
        textShadow: '0 0 20px rgba(10, 175, 230, 1), 0 0 20px rgba(10, 175, 230, 0)',
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        fontSize: 'clamp(3rem, 20vw, 8rem)', letterSpacing: '0.05em', zIndex: '9999'
    });
    Object.assign(document.body.style, {
        backgroundColor: '#0f3854', backgroundImage: 'radial-gradient(circle, #0a2e38 0%, #000000 70%)',
        height: '100vh', margin: '0', overflow: 'hidden'
    });
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    document.body.appendChild(clockElement);
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clockElement.textContent = \`\${hours}:\${minutes}:\${seconds}\`;
    }
    setInterval(updateClock, 1000);
    updateClock();
})();`,
      },
    },
    {
      id: 'template_todo_list',
      type: 'JavaScript',
      generationMode: 'javascript_code_generation',
      icon: 'list-checks',
      titleKey: 'template_todo_list_title',
      descriptionKey: 'template_todo_list_desc',
      promptKey: 'template_todo_list_prompt',
      design: 'todo',
      content: {
        text: `class TodoList {
    constructor(elementId) {
        this.tasks = [];
        this.container = document.getElementById(elementId);
        if (!this.container) {
            this.container = document.createElement('div');
            document.body.appendChild(this.container);
        }
        this.render();
    }
    addTask(text) {
        if (!text) return;
        this.tasks.push({ text, completed: false, id: Date.now() });
        this.render();
    }
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) task.completed = !task.completed;
        this.render();
    }
    render() {
        this.container.innerHTML = \`
            <input type="text" placeholder="New task..." onkeydown="if(event.key==='Enter') todoApp.addTask(this.value); this.value='';">
            <ul>\${this.tasks.map(t => \`
                <li style="text-decoration: \${t.completed ? 'line-through' : 'none'}; cursor: pointer;" onclick="todoApp.toggleTask(\${t.id})">\${t.text}</li>
            \`).join('')}</ul>
        \`;
    }
}
const todoApp = new TodoList('todo-root');
todoApp.addTask('Learn JavaScript');`,
      },
    },
    {
      id: 'template_api_fetch',
      type: 'JavaScript',
      generationMode: 'javascript_code_generation',
      icon: 'cloud',
      titleKey: 'template_api_fetch_title',
      descriptionKey: 'template_api_fetch_desc',
      promptKey: 'template_api_fetch_prompt',
      design: 'api',
      content: {
        text: `async function fetchAndDisplayUsers(url, elementId) {
    const container = document.getElementById(elementId) || document.body;
    container.textContent = 'Loading...';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const users = await response.json();
        container.innerHTML = '<h3>Users:</h3><ul>' + 
            users.map(user => \`<li>\${user.name} (\${user.email})</li>\`).join('') + 
            '</ul>';
    } catch (error) {
        container.textContent = 'Fetch error: ' + error.message;
    }
}
fetchAndDisplayUsers('https://jsonplaceholder.typicode.com/users', 'users-container');`,
      },
    },
    {
      id: 'template_countdown_timer',
      type: 'JavaScript',
      generationMode: 'javascript_code_generation',
      icon: 'timer',
      titleKey: 'template_countdown_timer_title',
      descriptionKey: 'template_countdown_timer_desc',
      promptKey: 'template_countdown_timer_prompt',
      design: 'timer',
      content: {
        text: `function startCountdown(seconds, elementId) {
    const timerElement = document.getElementById(elementId) || document.body;
    let counter = seconds;
    const interval = setInterval(() => {
        timerElement.textContent = counter;
        counter--;
        if (counter < 0) {
            clearInterval(interval);
            timerElement.textContent = "Time's up!";
        }
    }, 1000);
}
startCountdown(10, 'countdown-timer');`,
      },
    },
    {
      id: 'template_password_generator',
      type: 'JavaScript',
      generationMode: 'javascript_code_generation',
      icon: 'key-round',
      titleKey: 'template_password_generator_title',
      descriptionKey: 'template_password_generator_desc',
      promptKey: 'template_password_generator_prompt',
      design: 'password',
      content: {
        text: `function generatePassword(length, options) {
    const defaults = { numbers: true, symbols: true, uppercase: true, lowercase: true };
    const config = { ...defaults, ...options };
    const chars = [
        (config.numbers ? '0123456789' : ''),
        (config.symbols ? '!@#$%^&*()' : ''),
        (config.uppercase ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : ''),
        (config.lowercase ? 'abcdefghijklmnopqrstuvwxyz' : '')
    ].join('');
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
console.log(generatePassword(16, { symbols: false }));`,
      },
    },
    {
      id: 'template_calculator_logic',
      type: 'JavaScript',
      generationMode: 'javascript_code_generation',
      icon: 'calculator',
      titleKey: 'template_calculator_logic_title',
      descriptionKey: 'template_calculator_logic_desc',
      promptKey: 'template_calculator_logic_prompt',
      design: 'calculator',
      content: {
        text: `const calculator = {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b,
    divide: (a, b) => b !== 0 ? a / b : 'Error: Division by zero',
};
console.log('5 + 3 =', calculator.add(5, 3));
console.log('10 / 2 =', calculator.divide(10, 2));`,
      },
    },
    {
      id: 'template_form_validator',
      type: 'JavaScript',
      generationMode: 'javascript_code_generation',
      icon: 'check-check',
      titleKey: 'template_form_validator_title',
      descriptionKey: 'template_form_validator_desc',
      promptKey: 'template_form_validator_prompt',
      design: 'validator',
      content: {
        text: `const validator = {
    isEmail: (email) => /\\S+@\\S+\\.\\S+/.test(email),
    isStrongPassword: (pass) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$/.test(pass),
};
console.log('Is valid email?', validator.isEmail('test@example.com'));
console.log('Is strong password?', validator.isStrongPassword('Password123'));`,
      },
    },
    {
      id: 'template_modal_script',
      type: 'JavaScript',
      generationMode: 'javascript_code_generation',
      icon: 'app-window',
      titleKey: 'template_modal_script_title',
      descriptionKey: 'template_modal_script_desc',
      promptKey: 'template_modal_script_prompt',
      design: 'modal-script',
      content: {
        text: `// Assumes HTML: <button id="open">Open</button><div id="modal" style="display:none;">...<button id="close">Close</button></div>
const openBtn = document.getElementById('open');
const modal = document.getElementById('modal');
const closeBtn = document.getElementById('close');
const openModal = () => modal.style.display = 'block';
const closeModal = () => modal.style.display = 'none';
openBtn.onclick = openModal;
closeBtn.onclick = closeModal;
window.onclick = (event) => { if (event.target == modal) closeModal(); };`,
      },
    },
    {
      id: 'template_android_hello',
      type: 'Android',
      generationMode: 'android_app_generation',
      icon: 'smartphone',
      titleKey: 'template_android_hello_title',
      descriptionKey: 'template_android_hello_desc',
      promptKey: 'template_android_hello_prompt',
      design: 'android-hello',
      content: {
        manifestContent: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.myapplication">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MaterialComponents.DayNight.DarkActionBar">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,
        layoutXmlContent: `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">
    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Hello, Android!"
        android:textAppearance="@style/TextAppearance.MaterialComponents.Headline4"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />
</androidx.constraintlayout.widget.ConstraintLayout>`,
        activityCodeContent: `package com.example.myapplication

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }
}`,
      },
    },
    {
      id: 'template_android_counter',
      type: 'Android',
      generationMode: 'android_app_generation',
      icon: 'plus-circle',
      titleKey: 'template_android_counter_title',
      descriptionKey: 'template_android_counter_desc',
      promptKey: 'template_android_counter_prompt',
      design: 'android-counter',
      content: {
        manifestContent: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.clickcounter">
    <application android:theme="@style/Theme.MaterialComponents.DayNight.DarkActionBar">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" /><category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,
        layoutXmlContent: `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:padding="32dp">
    <TextView
        android:id="@+id/counterTextView"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="0"
        android:textSize="96sp"
        app:layout_constraintVertical_bias="0.3"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />
    <com.google.android.material.button.MaterialButton
        android:id="@+id/incrementButton"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:text="Increment"
        app:layout_constraintTop_toBottomOf="@id/counterTextView"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        android:layout_marginTop="32dp"/>
    <com.google.android.material.button.MaterialButton
        android:id="@+id/decrementButton"
        style="@style/Widget.MaterialComponents.Button.OutlinedButton"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:text="Decrement"
        app:layout_constraintTop_toBottomOf="@id/incrementButton"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        android:layout_marginTop="8dp"/>
</androidx.constraintlayout.widget.ConstraintLayout>`,
        activityCodeContent: `package com.example.clickcounter
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import com.google.android.material.snackbar.Snackbar

class MainActivity : AppCompatActivity() {
    private var count = 0
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        val counterTextView = findViewById<TextView>(R.id.counterTextView)
        val incrementButton = findViewById<Button>(R.id.incrementButton)
        val decrementButton = findViewById<Button>(R.id.decrementButton)
        incrementButton.setOnClickListener {
            count++
            counterTextView.text = count.toString()
        }
        decrementButton.setOnClickListener {
            if (count > 0) {
                count--
                counterTextView.text = count.toString()
            } else {
                Snackbar.make(it, "Cannot go below zero", Snackbar.LENGTH_SHORT).show()
            }
        }
    }
}`,
      },
    },
    {
      id: 'template_android_login',
      type: 'Android',
      generationMode: 'android_app_generation',
      icon: 'log-in',
      titleKey: 'template_android_login_title',
      descriptionKey: 'template_android_login_desc',
      promptKey: 'template_android_login_prompt',
      design: 'android-login',
      content: {
        manifestContent: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.loginapp">
    <application android:theme="@style/Theme.MaterialComponents.DayNight.NoActionBar">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" /><category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,
        layoutXmlContent: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:padding="24dp">
    <com.google.android.material.textfield.TextInputLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Email">
        <com.google.android.material.textfield.TextInputEditText
            android:id="@+id/emailEditText"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:inputType="textEmailAddress"/>
    </com.google.android.material.textfield.TextInputLayout>
    <com.google.android.material.textfield.TextInputLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        app:passwordToggleEnabled="true"
        android:hint="Password">
        <com.google.android.material.textfield.TextInputEditText
            android:id="@+id/passwordEditText"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:inputType="textPassword"/>
    </com.google.android.material.textfield.TextInputLayout>
    <com.google.android.material.button.MaterialButton
        android:id="@+id/loginButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Login"
        android:layout_marginTop="24dp"
        android:padding="12dp"/>
</LinearLayout>`,
        activityCodeContent: `package com.example.loginapp
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Toast
import com.google.android.material.button.MaterialButton

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        val loginButton = findViewById<MaterialButton>(R.id.loginButton)
        loginButton.setOnClickListener {
            Toast.makeText(this, "Login Clicked", Toast.LENGTH_SHORT).show()
        }
    }
}`,
      },
    },
    {
      id: 'template_android_tip_calculator',
      type: 'Android',
      generationMode: 'android_app_generation',
      icon: 'dollar-sign',
      titleKey: 'template_android_tip_calculator_title',
      descriptionKey: 'template_android_tip_calculator_desc',
      promptKey: 'template_android_tip_calculator_prompt',
      design: 'android-tip',
      content: {
        manifestContent: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.tipcalculator">
    <application android:theme="@style/Theme.MaterialComponents.DayNight.DarkActionBar"><activity android:name=".MainActivity" android:exported="true"><intent-filter><action android:name="android.intent.action.MAIN" /><category android:name="android.intent.category.LAUNCHER" /></intent-filter></activity></application>
</manifest>`,
        layoutXmlContent: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp">
    <EditText android:id="@+id/billAmount" android:layout_width="match_parent" android:layout_height="wrap_content" android:hint="Bill Amount" android:inputType="numberDecimal"/>
    <TextView android:id="@+id/tipResult" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Tip: $0.00" android:textSize="20sp" android:layout_marginTop="16dp"/>
    <TextView android:id="@+id/totalResult" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Total: $0.00" android:textSize="24sp" android:textStyle="bold" android:layout_marginTop="8dp"/>
</LinearLayout>`,
        activityCodeContent: `package com.example.tipcalculator
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.widget.EditText
import android.widget.TextView
import java.text.NumberFormat

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        val billAmountEditText = findViewById<EditText>(R.id.billAmount)
        val tipResultTextView = findViewById<TextView>(R.id.tipResult)
        val totalResultTextView = findViewById<TextView>(R.id.totalResult)

        billAmountEditText.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                calculateTip(s.toString(), tipResultTextView, totalResultTextView)
            }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })
    }
    private fun calculateTip(billString: String, tipView: TextView, totalView: TextView) {
        val billAmount = billString.toDoubleOrNull() ?: 0.0
        val tip = billAmount * 0.15
        val total = billAmount + tip
        tipView.text = "Tip: " + NumberFormat.getCurrencyInstance().format(tip)
        totalView.text = "Total: " + NumberFormat.getCurrencyInstance().format(total)
    }
}`,
      },
    },
    {
      id: 'template_android_profile_screen',
      type: 'Android',
      generationMode: 'android_app_generation',
      icon: 'user-circle',
      titleKey: 'template_android_profile_screen_title',
      descriptionKey: 'template_android_profile_screen_desc',
      promptKey: 'template_android_profile_screen_prompt',
      design: 'android-profile',
      content: {
        manifestContent: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.profilescreen">
    <application android:theme="@style/Theme.MaterialComponents.DayNight.NoActionBar"><activity android:name=".MainActivity" android:exported="true"><intent-filter><action android:name="android.intent.action.MAIN" /><category android:name="android.intent.category.LAUNCHER" /></intent-filter></activity></application>
</manifest>`,
        layoutXmlContent: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center_horizontal"
    android:padding="16dp">
    <ImageView android:id="@+id/profileImage" android:layout_width="120dp" android:layout_height="120dp" android:src="@android:drawable/sym_def_app_icon" android:contentDescription="Profile Picture"/>
    <TextView android:id="@+id/userName" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="User Name" android:textSize="24sp" android:layout_marginTop="16dp"/>
    <TextView android:id="@+id/userBio" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Bio goes here..." android:layout_marginTop="8dp"/>
</LinearLayout>`,
        activityCodeContent: `package com.example.profilescreen
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }
}`,
      },
    },
    {
      id: 'template_android_notes_app',
      type: 'Android',
      generationMode: 'android_app_generation',
      icon: 'notebook-pen',
      titleKey: 'template_android_notes_app_title',
      descriptionKey: 'template_android_notes_app_desc',
      promptKey: 'template_android_notes_app_prompt',
      design: 'android-notes',
      content: {
        manifestContent: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.notesapp">
    <application android:theme="@style/Theme.MaterialComponents.DayNight.DarkActionBar"><activity android:name=".MainActivity" android:exported="true"><intent-filter><action android:name="android.intent.action.MAIN" /><category android:name="android.intent.category.LAUNCHER" /></intent-filter></activity></application>
</manifest>`,
        layoutXmlContent: `<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">
    <ListView android:id="@+id/notesListView" android:layout_width="match_parent" android:layout_height="match_parent"/>
    <com.google.android.material.floatingactionbutton.FloatingActionButton
        android:id="@+id/addNoteFab"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:src="@android:drawable/ic_input_add"
        android:layout_alignParentBottom="true"
        android:layout_alignParentEnd="true"
        android:layout_margin="16dp"/>
</RelativeLayout>`,
        activityCodeContent: `package com.example.notesapp
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.ListView
import com.google.android.material.floatingactionbutton.FloatingActionButton

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        val notesListView = findViewById<ListView>(R.id.notesListView)
        val addNoteFab = findViewById<FloatingActionButton>(R.id.addNoteFab)
        val notes = arrayListOf("First Note", "Second Note")
        val adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, notes)
        notesListView.adapter = adapter
    }
}`,
      },
    },
    {
      id: 'template_android_image_viewer',
      type: 'Android',
      generationMode: 'android_app_generation',
      icon: 'image',
      titleKey: 'template_android_image_viewer_title',
      descriptionKey: 'template_android_image_viewer_desc',
      promptKey: 'template_android_image_viewer_prompt',
      design: 'android-image',
      content: {
        manifestContent: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.imageviewer">
    <application android:theme="@style/Theme.MaterialComponents.DayNight.NoActionBar"><activity android:name=".MainActivity" android:exported="true"><intent-filter><action android:name="android.intent.action.MAIN" /><category android:name="android.intent.category.LAUNCHER" /></intent-filter></activity></application>
</manifest>`,
        layoutXmlContent: `<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@android:color/black">
    <ImageView android:id="@+id/mainImageView" android:layout_width="match_parent" android:layout_height="match_parent" android:scaleType="fitCenter"/>
    <Button android:id="@+id/prevButton" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Prev" android:layout_alignParentStart="true" android:layout_alignParentBottom="true" android:layout_margin="16dp"/>
    <Button android:id="@+id/nextButton" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Next" android:layout_alignParentEnd="true" android:layout_alignParentBottom="true" android:layout_margin="16dp"/>
</RelativeLayout>`,
        activityCodeContent: `package com.example.imageviewer
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import android.widget.ImageView

class MainActivity : AppCompatActivity() {
    private val images = intArrayOf(android.R.drawable.star_on, android.R.drawable.star_off, android.R.drawable.star_big_on)
    private var currentIndex = 0
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        val imageView = findViewById<ImageView>(R.id.mainImageView)
        val prevButton = findViewById<Button>(R.id.prevButton)
        val nextButton = findViewById<Button>(R.id.nextButton)
        
        imageView.setImageResource(images[currentIndex])

        prevButton.setOnClickListener {
            currentIndex = (currentIndex - 1 + images.size) % images.size
            imageView.setImageResource(images[currentIndex])
        }
        nextButton.setOnClickListener {
            currentIndex = (currentIndex + 1) % images.size
            imageView.setImageResource(images[currentIndex])
        }
    }
}`,
      },
    }
  ];

const internalTranslations: Translation = {
    // General UI
    system: "System",
    speak: "Speak",
    stopRecording: "Stop Recording",
    createImage: "Create Image",
    createProject: "Create Project",
    model: "Model",
    chatsAndMenu: "Chats & Menu",
    modelSmooth: "Model: Smooth",
    smooth: "Smooth",
    pro: "Pro",
    modelSmoothDesc: "Fast and balanced for everyday tasks.",
    modelProDesc: "Advanced model for complex tasks. Uses daily points for Pro plan, unlimited for nano plan.",
    agent: "Nano",
    modelAgentDesc: "Premium feature. Thinks and executes complex tasks, consumes daily-refreshed nano points.",
    askAi: "Ask AI",
    askAboutCoding: "Ask about programming, code, or concepts...",
    attachMedia: "Attach Media",
    selectImage: "Select Image",
    selectFile: "Select File",
    captureImage: "Capture with Camera",
    cameraAccessDenied: "Camera access was denied. Please enable it in your browser settings.",
    createHtmlCode: "Create HTML Code",
    createJsCode: "JS Code",
    createAndroidApp: "Create Android App",
    scrollToBottom: "Scroll to Bottom",
    menu: "Menu",
    newChat: "New Chat",
    library: "Library",
    search: "Search...",
    noChatsYet: "No chats yet.",
    settings: "Settings",
    you: "You",
    errorOccurred: "An error occurred",
    errorOccurredSimple: "An error occurred",
    pleaseTryAgain: "Please try again.",
    responseStopped: "Response stopped.",
    continueResponse: "Continue response",
    openSidebar: "Open sidebar",
    closeSidebar: "Close sidebar",
    notifications: "Notifications",
    reportError: "Report Error",
    showDetails: "Show Details",
    hideDetails: "Hide Details",
    androidAppFiles: "ملفات تطبيق أندرويد",
    selectCamera: "Select Camera",
    cropImage: "Crop Image",
    applyCrop: "Apply Crop",
    cancelCrop: "Cancel Crop",
    
    // Welcome Screen
    welcomeMessage: "Start a new conversation, or try one of these suggestions:",
    q_react_hooks: "What are React Hooks?",
    q_cpp_vs_python: "Difference between C++ and Python",
    q_fix_reference_error: "How to fix a ReferenceError?",
    q_python_function_example: "Example of a Python function",
    q_explain_oop: "Explain the concept of OOP",

    // Context Menus & Actions
    messageOptions: "Message Options",
    copyText: "Copy Text",
    copied: "Copied!",
    regenerateResponse: "Regenerate Response",
    deleteMessage: "Delete Message",
    rename: "Rename",
    pin: "Pin",
    unpin: "Unpin",
    delete: "Delete",
    editMessage: "Edit Message",
    editProfile: "Edit Profile",
    regenerateWithWebSearch: "Regenerate with Web Search",
    goodResponse: "Good Response",
    badResponse: "Bad Response",
    regenerateWithDeepThinking: "Regenerate with Deep Thinking",
    searchingWeb: "Searching web...",
    thinking: "Thinking...",
    sources: "Sources",
    thinkingProcess: "Thinking Process",
    more: "More",
    reportChat: "Report Chat",
    reportMessage: "Report Message",
    reportTemplate: "Report Template",
    reportChatConfirm: "Are you sure you want to report this conversation? This will flag it for review.",
    report: "Report",
    chatOptions: "Chat Options",
    archive: "Archive",
    unarchive: "Unarchive",
    undo: "Undo",
    chatDeleted: "Chat deleted.",
    chatArchived: "Chat archived.",
    exportChat: "Export Chat",
    chatProjects: "Projects in this chat",
    untitledProject: "Untitled Project",
    
    // Modals & Sheets
    close: "Close",
    confirmAction: "Confirm Action",
    areYouSure: "Are you sure you want to proceed?",
    cancel: "Cancel",
    confirm: "Confirm",
    done: "Done",
    renameChatTitle: "Rename Chat",
    renameProjectTitle: "Rename Project",
    upgradeRequiredTitle: "Upgrade Required",
    upgradeRequiredMessage: "This feature requires a Pro or Nano plan. Please upgrade to continue.",
    upgrade: "Upgrade",
    proPointsExhaustedTitle: "Points Exhausted",
    proPointsExhaustedMessage: "You have used all your daily Smooth points. They will reset in 24 hours. Upgrade for more points.",
    resetChat: "Reset Chat",
    resetChatConfirmTitle: "Reset Conversation?",
    resetChatConfirmMessage: "This will clear the entire conversation and reset the AI's memory about this project. This is useful for large projects to prevent overwhelming the AI. This action cannot be undone.",
    chatPanelTitle: "Chat",

    // Checkpoint Feature
    checkpoint: "Checkpoint",
    projectRestored: "Project restored to checkpoint.",
    alreadyOnCheckpoint: "You are already at this checkpoint",
    versionHistory: "Version History",
    revert: "Revert",
    originalVersion: "Original Version",
    revertToThisVersion: "Revert to this version",
    active: "Active",
    viewHistory: "View History",
    manualEdit: "Manual Edit",

    // New Template Translations
    template_portfolio_title: "Portfolio",
    template_portfolio_desc: "A clean, single-page portfolio to showcase your projects.",
    template_portfolio_prompt: "Create a simple, responsive portfolio website.",
    template_landing_page_title: "Landing Page",
    template_landing_page_desc: "A modern landing page with a hero section and a call-to-action.",
    template_landing_page_prompt: "Design a visually appealing product landing page.",
    template_blog_post_title: "Blog Post Layout",
    template_blog_post_desc: "A classic blog post layout with a main content area and a sidebar.",
    template_blog_post_prompt: "Generate a standard blog post HTML structure.",
    template_login_form_title: "Login Form",
    template_login_form_desc: "A centered, stylish login form for user authentication.",
    template_login_form_prompt: "Create a modern login form component.",
    template_survey_form_title: "Survey Form",
    template_survey_form_desc: "A simple, clean survey form with various input types.",
    template_survey_form_prompt: "Create a responsive survey form for user feedback.",
    template_product_card_title: "Product Card",
    template_product_card_desc: "An e-commerce product card with an image, price, and button.",
    template_product_card_prompt: "Generate an HTML and CSS product card.",
    template_image_gallery_title: "Image Gallery",
    template_image_gallery_desc: "A responsive grid-based image gallery with hover effects.",
    template_image_gallery_prompt: "Create a responsive image gallery.",
    template_digital_clock_title: "Digital Clock",
    template_digital_clock_desc: "A JavaScript function that prints the time to the console every second.",
    template_digital_clock_prompt: "Write a simple digital clock script.",
    template_todo_list_title: "To-Do List Logic",
    template_todo_list_desc: "Basic JavaScript functions to manage a simple to-do list.",
    template_todo_list_prompt: "Provide the core logic for a JavaScript to-do list.",
    template_api_fetch_title: "API Fetch",
    template_api_fetch_desc: "An async function to fetch and log data from a JSON API.",
    template_api_fetch_prompt: "Write a JavaScript function to fetch data from an API.",
    template_countdown_timer_title: "Countdown Timer",
    template_countdown_timer_desc: "A script that counts down from a specified number of seconds.",
    template_countdown_timer_prompt: "Create a countdown timer in JavaScript.",
    template_android_hello_title: 'Simple Android App',
    template_android_hello_desc: 'A basic "Hello World" Android application structure.',
    template_android_hello_prompt: 'Create a simple Hello World Android app.',
    template_android_counter_title: 'Click Counter App',
    template_android_counter_desc: 'An app with a button and a text view to count clicks.',
    template_android_counter_prompt: 'Create an Android app that counts button clicks.',
    template_android_login_title: 'Login Screen UI',
    template_android_login_desc: 'A standard login screen UI with email and password fields.',
    template_android_login_prompt: 'Create a simple login screen for an Android app.',
    template_restaurant_menu_title: "Restaurant Menu",
    template_restaurant_menu_desc: "A classic layout for a restaurant's food menu.",
    template_restaurant_menu_prompt: "Create a simple restaurant menu page.",
    template_admin_dashboard_title: "Admin Dashboard Layout",
    template_admin_dashboard_desc: "A basic admin panel with a sidebar and main content area.",
    template_admin_dashboard_prompt: "Generate a simple admin dashboard layout.",
    template_faq_accordion_title: "FAQ Accordion",
    template_faq_accordion_desc: "An interactive FAQ section with collapsible items.",
    template_faq_accordion_prompt: "Create an HTML and JS FAQ accordion.",
    template_contact_form_title: "Contact Form",
    template_contact_form_desc: "A standard, responsive contact form.",
    template_contact_form_prompt: "Generate a contact form.",
    template_weather_widget_title: "Weather Widget UI",
    template_weather_widget_desc: "A compact and stylish UI for displaying weather.",
    template_weather_widget_prompt: "Create a weather widget UI.",
    template_music_player_title: "Music Player UI",
    template_music_player_desc: "A simple and clean interface for a music player.",
    template_music_player_prompt: "Design a music player UI.",
    template_404_page_title: "404 Error Page",
    template_404_page_desc: "A creative 'Page Not Found' error page.",
    template_404_page_prompt: "Create a 404 error page.",
    template_pricing_table_title: "Pricing Table",
    template_pricing_table_desc: "A responsive table to display different pricing plans.",
    template_pricing_table_prompt: "Generate a pricing table.",
    template_password_generator_title: "Password Generator",
    template_password_generator_desc: "A script to generate random, secure passwords.",
    template_password_generator_prompt: "Write a password generator script.",
    template_calculator_logic_title: "Calculator Logic",
    template_calculator_logic_desc: "Core functions for a simple calculator.",
    template_calculator_logic_prompt: "Provide logic for a basic calculator.",
    template_form_validator_title: "Form Validator",
    template_form_validator_desc: "A script for simple client-side form validation.",
    template_form_validator_prompt: "Create a form validation script.",
    template_modal_script_title: "Modal/Popup Script",
    template_modal_script_desc: "JavaScript logic to toggle a modal window.",
    template_modal_script_prompt: "Write a script to handle a modal popup.",
    template_android_tip_calculator_title: "Tip Calculator UI",
    template_android_tip_calculator_desc: "A simple Android UI for calculating tips.",
    template_android_tip_calculator_prompt: "Create an Android tip calculator UI.",
    template_android_profile_screen_title: "Profile Screen UI",
    template_android_profile_screen_desc: "A standard user profile screen layout for Android.",
    template_android_profile_screen_prompt: "Generate an Android user profile screen.",
    template_android_notes_app_title: "Notes App UI",
    template_android_notes_app_desc: "A basic UI for a note-taking application on Android.",
    template_android_notes_app_prompt: "Create a simple notes app UI for Android.",
    template_android_image_viewer_title: "Image Viewer UI",
    template_android_image_viewer_desc: "A simple UI with a main image view and navigation buttons.",
    template_android_image_viewer_prompt: "Design a simple image viewer screen for Android.",

    // Library Filter buttons
    filterAll: "All",
    filterHtml: "HTML",
    filterJs: "JavaScript",
    filterAndroid: "Android",
};
const arTranslations: Translation = {
    ...internalTranslations,
    system: "النظام",
    speak: "تحدث",
    stopRecording: "إيقاف التسجيل",
    createImage: "إنشاء صورة",
    createProject: "إنشاء مشروع",
    model: "النموذج",
    chatsAndMenu: "المحادثات والقائمة",
    modelSmooth: "النموذج: سلس",
    smooth: "سلس",
    pro: "محترف",
    modelSmoothDesc: "سريع ومتوازن للمهام اليومية.",
    modelProDesc: "نموذج متقدم للمهام المعقدة. يستهلك نقاطًا يومية لخطة المحترفين، وغير محدود لخطة نانو.",
    agent: "نانو",
    modelAgentDesc: "ميزة مميزة. يفكر وينفذ المهام المعقدة، ويستهلك نقاط نانو تتجدد يوميًا.",
    askAi: "اسأل الذكاء الاصطناعي",
    askAboutCoding: "اسأل عن البرمجة، الأكواد، أو المفاهيم...",
    attachMedia: "إرفاق وسائط",
    selectImage: "اختر صورة",
    selectFile: "اختر ملفًا",
    captureImage: "التقط بالكاميرا",
    cameraAccessDenied: "تم رفض الوصول إلى الكاميرا. يرجى تمكينه في إعدادات متصفحك.",
    createHtmlCode: "إنشاء كود HTML",
    createJsCode: "كود JS",
    createAndroidApp: "إنشاء تطبيق أندرويد",
    scrollToBottom: "انزل للأسفل",
    menu: "القائمة",
    newChat: "محادثة جديدة",
    library: "المكتبة",
    search: "بحث...",
    noChatsYet: "لا توجد محادثات بعد.",
    settings: "الإعدادات",
    you: "أنت",
    errorOccurred: "حدث خطأ",
    errorOccurredSimple: "حدث خطأ",
    pleaseTryAgain: "يرجى المحاولة مرة أخرى.",
    responseStopped: "توقفت الاستجابة.",
    continueResponse: "متابعة الاستجابة",
    openSidebar: "افتح الشريط الجانبي",
    closeSidebar: "أغلق الشريط الجانبي",
    notifications: "الإشعارات",
    reportError: "الإبلاغ عن خطأ",
    showDetails: "إظهار التفاصيل",
    hideDetails: "إخفاء التفاصيل",
    selectCamera: "اختر كاميرا",
    cropImage: "قص الصورة",
    applyCrop: "تطبيق القص",
    cancelCrop: "إلغاء القص",
    welcomeMessage: "ابدأ محادثة جديدة، أو جرب إحدى هذه الاقتراحات:",
    q_react_hooks: "ما هي React Hooks؟",
    q_cpp_vs_python: "الفرق بين C++ و Python",
    q_fix_reference_error: "كيفية إصلاح خطأ ReferenceError؟",
    q_python_function_example: "مثال على دالة في Python",
    q_explain_oop: "اشرح مفهوم البرمجة الشيئية",
    messageOptions: "خيارات الرسالة",
    copyText: "نسخ النص",
    copied: "تم النسخ!",
    regenerateResponse: "إعادة إنشاء الاستجابة",
    deleteMessage: "حذف الرسالة",
    rename: "إعادة تسمية",
    pin: "تثبيت",
    unpin: "إلغاء التثبيت",
    delete: "حذف",
    editMessage: "تعديل الرسالة",
    editProfile: "تعديل الملف الشخصي",
    regenerateWithWebSearch: "إعادة الإنشاء مع البحث على الويب",
    goodResponse: "استجابة جيدة",
    badResponse: "استجابة سيئة",
    regenerateWithDeepThinking: "إعادة الإنشاء مع التفكير العميق",
    searchingWeb: "جاري البحث في الويب...",
    thinking: "جاري التفكير...",
    sources: "المصادر",
    thinkingProcess: "عملية التفكير",
    more: "المزيد",
    reportChat: "الإبلاغ عن المحادثة",
    reportMessage: "الإبلاغ عن الرسالة",
    reportTemplate: "الإبلاغ عن القالب",
    reportChatConfirm: "هل أنت متأكد من أنك تريد الإبلاغ عن هذه المحادثة؟ سيؤدي هذا إلى وضع علامة عليها للمراجعة.",
    report: "إبلاغ",
    chatOptions: "خيارات المحادثة",
    archive: "أرشفة",
    unarchive: "إلغاء الأرشفة",
    undo: "تراجع",
    chatDeleted: "تم حذف المحادثة.",
    chatArchived: "تم أرشفة المحادثة.",
    exportChat: "تصدير المحادثة",
    chatProjects: "مشاريع هذه المحادثة",
    untitledProject: "مشروع بدون عنوان",
    close: "إغلاق",
    confirmAction: "تأكيد الإجراء",
    areYouSure: "هل أنت متأكد من رغبتك في المتابعة؟",
    cancel: "إلغاء",
    confirm: "تأكيد",
    done: "تم",
    renameChatTitle: "إعادة تسمية المحادثة",
    renameProjectTitle: "إعادة تسمية المشروع",
    upgradeRequiredTitle: "الترقية مطلوبة",
    upgradeRequiredMessage: "تتطلب هذه الميزة خطة Pro أو Nano. يرجى الترقية للمتابعة.",
    upgrade: "ترقية",
    proPointsExhaustedTitle: "نفدت النقاط",
    proPointsExhaustedMessage: "لقد استهلكت جميع نقاطك اليومية من خطة Smooth. سيتم إعادة تعيينها خلال 24 ساعة. قم بالترقية للحصول على المزيد من النقاط.",
    signIn: "تسجيل الدخول",
    resetChat: "إعادة الضبط",
    resetChatConfirmTitle: "إعادة ضبط المحادثة؟",
    resetChatConfirmMessage: "سيؤدي هذا إلى مسح المحادثة بأكملها وإعادة ضبط ذاكرة الذكاء الاصطناعي بخصوص هذا المشروع. هذا مفيد للمشاريع الكبيرة لمنع إرباك الذكاء الاصطناعي. لا يمكن التراجع عن هذا الإجراء.",
    chatPanelTitle: "محادثة",

    // Checkpoint Feature
    checkpoint: "نقطة الوصول",
    projectRestored: "تمت استعادة المشروع إلى نقطة الوصول.",
    alreadyOnCheckpoint: "أنت بالفعل عند نقطة الوصول هذه",
    versionHistory: "سجل الإصدارات",
    revert: "استرجاع",
    originalVersion: "الإصدار الأصلي",
    revertToThisVersion: "الرجوع إلى هذا الإصدار",
    active: "نشط",
    viewHistory: "عرض السجل",
    manualEdit: "تعديل يدوي",

    // New Template Translations (Arabic)
    template_portfolio_title: "ملف أعمال",
    template_portfolio_desc: "ملف أعمال نظيف من صفحة واحدة لعرض مشاريعك.",
    template_portfolio_prompt: "أنشئ موقع ملف أعمال بسيط ومتجاوب.",
    template_landing_page_title: "صفحة هبوط",
    template_landing_page_desc: "صفحة هبوط عصرية مع قسم رئيسي ودعوة لاتخاذ إجراء.",
    template_landing_page_prompt: "صمم صفحة هبوط جذابة بصريًا للمنتج.",
    template_blog_post_title: "تخطيط تدوينة",
    template_blog_post_desc: "تخطيط تدوينة كلاسيكي مع منطقة محتوى رئيسية وشريط جانبي.",
    template_blog_post_prompt: "أنشئ هيكل HTML قياسي لتدوينة.",
    template_login_form_title: "نموذج تسجيل دخول",
    template_login_form_desc: "نموذج تسجيل دخول أنيق في المنتصف لمصادقة المستخدم.",
    template_login_form_prompt: "أنشئ مكون نموذج تسجيل دخول عصري.",
    template_survey_form_title: "نموذج استبيان",
    template_survey_form_desc: "نموذج استبيان بسيط ونظيف مع أنواع إدخال مختلفة.",
    template_survey_form_prompt: "أنشئ نموذج استبيان متجاوب لجمع آراء المستخدمين.",
    template_product_card_title: "بطاقة منتج",
    template_product_card_desc: "بطاقة منتج للتجارة الإلكترونية مع صورة وسعر وزر.",
    template_product_card_prompt: "أنشئ بطاقة منتج باستخدام HTML و CSS.",
    template_image_gallery_title: "معرض صور",
    template_image_gallery_desc: "معرض صور متجاوب يعتمد على الشبكة مع تأثيرات عند التمرير.",
    template_image_gallery_prompt: "أنشئ معرض صور متجاوب.",
    template_digital_clock_title: "ساعة رقمية",
    template_digital_clock_desc: "دالة جافاسكريبت تطبع الوقت في الكونسول كل ثانية.",
    template_digital_clock_prompt: "اكتب سكربت بسيط لساعة رقمية.",
    template_todo_list_title: "منطق قائمة مهام",
    template_todo_list_desc: "دوال جافاسكريبت أساسية لإدارة قائمة مهام بسيطة.",
    template_todo_list_prompt: "وفر المنطق الأساسي لقائمة مهام بجافاسكريبت.",
    template_api_fetch_title: "جلب API",
    template_api_fetch_desc: "دالة غير متزامنة لجلب وتسجيل البيانات من JSON API.",
    template_api_fetch_prompt: "اكتب دالة جافاسكريبت لجلب البيانات من API.",
    template_countdown_timer_title: "مؤقت عد تنازلي",
    template_countdown_timer_desc: "سكربت يقوم بالعد التنازلي من عدد محدد من الثواني.",
    template_countdown_timer_prompt: "أنشئ مؤقت عد تنازلي بجافاسكريبت.",
    template_android_hello_title: 'تطبيق أندرويد بسيط',
    template_android_hello_desc: 'هيكل تطبيق أندرويد أساسي "أهلاً بالعالم".',
    template_android_hello_prompt: 'أنشئ تطبيق أندرويد بسيط يقول أهلاً بالعالم.',
    template_android_counter_title: 'تطبيق عداد النقرات',
    template_android_counter_desc: 'تطبيق يحتوي على زر وعرض نصي لعد النقرات.',
    template_android_counter_prompt: 'أنشئ تطبيق أندرويد يقوم بعد نقرات الزر.',
    template_android_login_title: 'واجهة شاشة تسجيل الدخول',
    template_android_login_desc: 'واجهة مستخدم قياسية لشاشة تسجيل الدخول مع حقول للبريد الإلكتروني وكلمة المرور.',
    template_android_login_prompt: 'أنشئ شاشة تسجيل دخول بسيطة لتطبيق أندرويد.',
    template_restaurant_menu_title: "قائمة طعام",
    template_restaurant_menu_desc: "تصميم كلاسيكي لقائمة طعام مطعم.",
    template_restaurant_menu_prompt: "أنشئ صفحة قائمة طعام لمطعم.",
    template_admin_dashboard_title: "لوحة تحكم إدارية",
    template_admin_dashboard_desc: "تصميم أساسي للوحة تحكم مع شريط جانبي ومحتوى رئيسي.",
    template_admin_dashboard_prompt: "أنشئ تصميم لوحة تحكم إدارية.",
    template_faq_accordion_title: "أسئلة شائعة (أكورديون)",
    template_faq_accordion_desc: "قسم أسئلة وأجوبة تفاعلي قابل للطي.",
    template_faq_accordion_prompt: "أنشئ أكورديون للأسئلة الشائعة.",
    template_contact_form_title: "نموذج تواصل",
    template_contact_form_desc: "نموذج تواصل قياسي ومتجاوب.",
    template_contact_form_prompt: "أنشئ نموذج تواصل.",
    template_weather_widget_title: "واجهة الطقس",
    template_weather_widget_desc: "واجهة مدمجة وأنيقة لعرض حالة الطقس.",
    template_weather_widget_prompt: "أنشئ واجهة لعرض الطقس.",
    template_music_player_title: "واجهة مشغل موسيقى",
    template_music_player_desc: "واجهة بسيطة ونظيفة لمشغل موسيقى.",
    template_music_player_prompt: "صمم واجهة مشغل موسيقى.",
    template_404_page_title: "صفحة خطأ 404",
    template_404_page_desc: "صفحة خطأ إبداعية 'الصفحة غير موجودة'.",
    template_404_page_prompt: "أنشئ صفحة خطأ 404.",
    template_pricing_table_title: "جدول أسعار",
    template_pricing_table_desc: "جدول متجاوب لعرض خطط أسعار مختلفة.",
    template_pricing_table_prompt: "أنشئ جدول أسعار.",
    template_password_generator_title: "مولد كلمات مرور",
    template_password_generator_desc: "سكربت لتوليد كلمات مرور عشوائية وآمنة.",
    template_password_generator_prompt: "اكتب سكربت لتوليد كلمات مرور.",
    template_calculator_logic_title: "منطق آلة حاسبة",
    template_calculator_logic_desc: "الدوال الأساسية لآلة حاسبة بسيطة.",
    template_calculator_logic_prompt: "وفر المنطق لآلة حاسبة بسيطة.",
    template_form_validator_title: "مدقق نماذج",
    template_form_validator_desc: "سكربت للتحقق من صحة النماذج من جانب العميل.",
    template_form_validator_prompt: "أنشئ سكربت للتحقق من النماذج.",
    template_modal_script_title: "سكربت نافذة منبثقة",
    template_modal_script_desc: "منطق جافاسكريبت لفتح وإغلاق نافذة منبثقة.",
    template_modal_script_prompt: "اكتب سكربت للتعامل مع نافذة منبثقة.",
    template_android_tip_calculator_title: "واجهة حاسبة الإكرامية",
    template_android_tip_calculator_desc: "واجهة أندرويد بسيطة لحساب الإكراميات.",
    template_android_tip_calculator_prompt: "أنشئ واجهة حاسبة إكرامية لأندرويد.",
    template_android_profile_screen_title: "واجهة شاشة الملف الشخصي",
    template_android_profile_screen_desc: "تصميم شاشة ملف شخصي قياسي لأندرويد.",
    template_android_profile_screen_prompt: "أنشئ شاشة ملف شخصي لأندرويد.",
    template_android_notes_app_title: "واجهة تطبيق ملاحظات",
    template_android_notes_app_desc: "واجهة أساسية لتطبيق تدوين ملاحظات على أندرويد.",
    template_android_notes_app_prompt: "أنشئ واجهة تطبيق ملاحظات بسيطة لأندرويد.",
    template_android_image_viewer_title: "واجهة عارض صور",
    template_android_image_viewer_desc: "واجهة بسيطة مع عرض صورة رئيسي وأزرار تنقل.",
    template_android_image_viewer_prompt: "صمم شاشة عارض صور بسيطة لأندرويد.",

    // Library Filter buttons (Arabic)
    filterAll: "الكل",
    filterHtml: "HTML",
    filterJs: "JavaScript",
    filterAndroid: "أندرويد",
};

export const translations: Translations = {
    ar: arTranslations,
    en: internalTranslations as Translation,
    zh: internalTranslations as Translation,
    es: internalTranslations as Translation,
    fr: internalTranslations as Translation,
    hi: internalTranslations as Translation,
    // FIX: Add missing 'system' property to satisfy the Translations type.
    system: internalTranslations as Translation,
};