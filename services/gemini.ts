// FIX: Corrected import to reference the dedicated types file and resolve circular dependencies.
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, GenerateContentResponse, Content, Part, Type } from "@google/genai";
import { Message, Settings, GenerationMode, Language, Project, InspectionIssue } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const defaultGenerationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 64,
};

const buildBaseInstruction = (settings: Settings): string => {
    const instructions: string[] = [
        `You are nanom ai studio, an expert programmer and AI assistant.`,
        `CRITICAL IDENTITY RULES:`,
        `- Your name is "nanom ai". If asked for your name, you must respond with "nanom ai".`,
        `- You were created by "score studio company". If asked who created or made you, you must respond with "score studio company".`,
        `- In Arabic: إذا سئلت "ما اسمك؟"، يجب أن تجيب بـ "nanom ai".`,
        `- In Arabic: إذا سئلت "من صنعك؟"، يجب أن تجيب بـ "شركة score studio".`,

        `Your responses must adhere to the following user-defined settings:`,
        `- General Response Style: ${settings.aiStyle}`,
        `- Code Explanation Level: ${settings.aiExplanation}`,
        `- Code Generation Target Environment: ${settings.codeTarget}`
    ];
    
    if (settings.userName) {
        instructions.push(`- User's Name: ${settings.userName}. You may address the user by their name.`);
    }
    if (settings.userInfo) {
        instructions.push(`- About the User: ${settings.userInfo}. Use this context to tailor your responses.`);
    }

    if (settings.commentStyle && settings.commentStyle !== 'none') {
        instructions.push(`- Code Commenting Style: ${settings.commentStyle}`);
    }
    if (settings.variableCasing && settings.variableCasing !== 'none') {
        instructions.push(`- Casing for variables: ${settings.variableCasing}`);
    }
    if (settings.functionCasing && settings.functionCasing !== 'none') {
        instructions.push(`- Casing for functions: ${settings.functionCasing}`);
    }
    if (settings.cssPreference && settings.cssPreference !== 'none') {
        instructions.push(`- Preferred CSS methodology: ${settings.cssPreference.replace('_', '-')}`);
    }
    if (settings.apiStyle && settings.apiStyle !== 'none') {
        instructions.push(`- Preferred API style: ${settings.apiStyle}`);
    }
    if (settings.errorHandling && settings.errorHandling !== 'none') {
        let handlingText = '';
        switch (settings.errorHandling) {
            case 'throw': handlingText = 'throw errors directly'; break;
            case 'try_catch': handlingText = 'use try/catch blocks for graceful failure'; break;
            case 'return_null': handlingText = 'return null or an equivalent empty state on failure'; break;
        }
        instructions.push(`- Preferred Error Handling Strategy: ${handlingText}`);
    }
    if (settings.techStack) {
        instructions.push(`- Preferred Technology Stack: ${settings.techStack}`);
    }
    if (settings.aiPreferences) {
        instructions.push(`- Other User Programming Preferences: ${settings.aiPreferences}`);
    }
    
    const reasoningInstruction = `
### Reasoning Instructions
- If you perform complex thinking, web searches, or analysis (especially when 'Deep Thinking' mode is on), you MUST provide your step-by-step reasoning process.
- The reasoning process MUST be in the same language as the user's prompt (e.g., if the user writes in Arabic, the reasoning must be in Arabic).
- Embed this reasoning inside a special block at the VERY END of your response. The block format is: [REASONING_START]Your detailed reasoning here...[REASONING_END]
- This block will be hidden from the user. Do not mention it in your conversational response.`;
    instructions.push(reasoningInstruction);

    if (settings.useMemory) {
        const memoryFacts = (settings.memoryItems && settings.memoryItems.length > 0) 
            ? `\n\n### User Memory Context (Facts you already know):\n${settings.memoryItems.map(item => `- ${item.content}`).join('\n')}`
            : "";
        
        const memoryInstruction = `
### AI Memory Instructions
- You have a memory feature.
- When you identify a new, important, and permanent fact about the user (like their name, profession, core preferences, long-term goals) from the conversation, you MUST save it.
- To save, embed a special block at the VERY END of your response, after the reasoning block if present. The block MUST be in this exact format: [MEMORIES_START]JSON_ARRAY_OF_STRINGS[MEMORIES_END].
- Example: [MEMORIES_START]["My name is Bard", "I am a frontend developer"][MEMORIES_END]
- Only add NEW facts that are not already in the User Memory Context above.
- If there are no new facts to save, do not include the block.
- This block will be hidden from the user. Do not mention it in your conversational response.`;

        instructions.push(memoryInstruction + memoryFacts);
    }

    return instructions.join('\n');
}

const aestheticInstructions = `
AESTHETICS & UX/UI CRITICAL INSTRUCTIONS (Apply these for any HTML/web-based project):
- Visual Appeal is Paramount: The generated project MUST be visually appealing, modern, and professional. Do not create a basic, unstyled HTML page.
- Layout: Use modern CSS layout techniques like Flexbox or CSS Grid to create a structured and clean layout. Avoid using tables for layout.
- Color Palette: Choose a harmonious and modern color palette. Do not use default browser colors. Ensure good contrast for readability.
- Typography: Use a clean, readable font (e.g., from Google Fonts). Establish a clear visual hierarchy with different font sizes and weights for headings and body text.
- Content: Use realistic and well-formatted placeholder content that is relevant to the user's prompt. Do not use "Lorem Ipsum".
- Responsiveness: The design MUST be responsive and look good on both desktop and mobile screens. Use media queries correctly.
- Spacing: Use appropriate padding and margins to give elements breathing room. Don't cram elements together.
- Overall: The final output should look like a well-designed, polished mini-webpage or component, not a barebones technical skeleton.
`;

const buildSystemInstructionForProjects = (settings: Settings, generationMode: GenerationMode, isEditing: boolean, projectContext: Project | null, language: Language): string => {
    const baseInstruction = buildBaseInstruction(settings);
    const instructionPrefixForNew = "CRITICAL: Generate a complete, valid JSON object string. Your entire response MUST be a single JSON object. Do not include any other text, explanations, or markdown formatting.";

    const languageName = {
        ar: 'Arabic',
        en: 'English',
        zh: 'Chinese',
        es: 'Spanish',
        fr: 'French',
        hi: 'Hindi'
    }[language] || 'English';

    if (isEditing && projectContext) {
        let projectCode;
        if (projectContext.type === 'HTML') {
            projectCode = projectContext.htmlContent || '';
        } else if (projectContext.type === 'JavaScript') {
            projectCode = `\`\`\`javascript\n${projectContext.text?.replace(/```javascript\n|```/g, '').trim()}\n\`\`\``;
        } else if (projectContext.type === 'Android') {
            projectCode = JSON.stringify({ 
                manifest: projectContext.manifestContent, 
                layout_xml: projectContext.layoutXmlContent, 
                main_activity_kt: projectContext.activityCodeContent 
            }, null, 2);
        }
        
        const coordinateInstruction = `
If the user's prompt begins with "Selected area coordinates", it specifies a bounding box of an element to be modified. You must first identify the HTML element(s) that would visually appear within that bounding box in a standard browser viewport. Then, apply the user's text request (which follows the coordinates) specifically to those identified elements. The coordinates are {x, y, width, height} from the top-left corner of the viewport.`;

        const editInstruction = `CRITICAL: Your entire response MUST be a single, valid JSON object string. The JSON object must have three top-level keys: "code", "chat_reply", and "edit_summary".
- The "code" value MUST be an object containing the complete, modified code file(s), matching the project type's original format (e.g., {"html": "..."}).
- The "chat_reply" value MUST be a short, natural, conversational response in ${languageName}, confirming the changes you made. For example: "Sure, I've updated the button style as you requested." or "Done! The animation has been added."
- The "edit_summary" value MUST be a concise but descriptive summary in ${languageName} of the change performed. It should be suitable for a version history log. Examples: "Added password validation", "Changed button color to blue", "Implemented dark mode toggle".
- Do not add any other text, explanations, or markdown formatting outside of this single JSON object.
- Example response format: {"code": {"html": "<!DOCTYPE..."}, "chat_reply": "I've applied the changes...", "edit_summary": "Updated button styles"}`;
        
        return `CRITICAL CONTEXT: You are editing an existing project.
Project Type: ${projectContext.type}
Original Prompt: ${projectContext.prompt}
--- START OF PROJECT CODE TO EDIT ---
${projectCode}
--- END OF PROJECT CODE TO EDIT ---
Now, apply the user's latest request to the project code above.
${coordinateInstruction}
${editInstruction}
${baseInstruction}`;
    }
    
    let projectGenInstruction = `You are an intelligent project generator. First, analyze the user's prompt to determine the project type. It must be one of: 'html', 'javascript', or 'android'. Then, generate the necessary code files for that project type. You MUST also create a short, creative, and concise title for the project in ${languageName} and include it in the 'project_title' key in the root of the JSON object.`;
    
    if (settings.projectCreationResponse === 'respond_then_create') {
        projectGenInstruction += ` Your JSON response MUST also include a 'chat_reply' key in the root object with a brief, conversational confirmation message in ${languageName}. The message should state that you have understood the request and are now creating the project (e.g., "Understood. I will create the project for you now.").`;
    }

    const titleFormat = `"project_title": "A short, creative, and concise title for the project based on the user's request, in ${languageName}."`;
    const chatReplyFormat = settings.projectCreationResponse === 'respond_then_create' ? `, "chat_reply": "optional string"` : '';

    switch(generationMode) {
        case 'project_generation': {
             const htmlFormat = `For 'html' type, 'code' object is a single key: {"html": "COMPLETE_SELF_CONTAINED_HTML_STRING"}. The HTML MUST include all CSS in a <style> tag and all JS in a <script> tag.`;
             const jsFormat = `For 'javascript' type, 'code' object is: {"javascript": "..."}.`;
             const androidFormat = `For 'android' type, 'code' object is: {"manifest": "...", "layout_xml": "...", "main_activity_kt": "..."}.`;
             const jsonFormat = `The JSON format MUST be: {"project_type": "THE_TYPE_YOU_DETECTED", ${titleFormat}, "code": { ...files... }${chatReplyFormat}}.\n- ${htmlFormat}\n- ${jsFormat}\n- ${androidFormat}`;
             return `${instructionPrefixForNew} ${projectGenInstruction}\n${jsonFormat}\n${aestheticInstructions}\n${baseInstruction}`;
        }
        case 'code_generation': {
            return `${instructionPrefixForNew} The JSON must be in the format '{"html": "COMPLETE_SELF_CONTAINED_HTML_STRING", ${titleFormat}${chatReplyFormat}}'. The HTML MUST include all CSS in a <style> tag and all JS in a <script> tag.\n${projectGenInstruction}\n${aestheticInstructions}\n${baseInstruction}`;
        }
        case 'javascript_code_generation': {
            return `${instructionPrefixForNew} The JSON must be in the format '{"javascript": "...", ${titleFormat}${chatReplyFormat}}'.\n${projectGenInstruction}\n${baseInstruction}`;
        }
        case 'android_app_generation': {
            const androidSpecificInstructions = `
CRITICAL ANDROID GENERATION INSTRUCTIONS:
- You are generating an Android project. The output MUST be a JSON object with keys "manifest", "layout_xml", and "main_activity_kt".
- **Manifest:** Create a valid AndroidManifest.xml. Include necessary permissions if implied (e.g., INTERNET).
- **Layout:** Create a well-structured activity_main.xml. Use modern layouts like ConstraintLayout and give interactive UI elements an 'android:id'.
- **Activity:** Create a complete MainActivity.kt. In 'onCreate', you MUST find UI elements by their ID (e.g., 'findViewById') and set up their functionality (e.g., 'setOnClickListener'). The code must be functional and reflect the user's request.
- Ensure all three files are consistent and work together. Use XML layouts, not Jetpack Compose unless specified.
`;
            return `${instructionPrefixForNew} ${projectGenInstruction}\n${androidSpecificInstructions}\nThe JSON must be in the format '{"manifest": "...", "layout_xml": "...", "main_activity_kt": "...", ${titleFormat}${chatReplyFormat}}'.\n${baseInstruction}`;
        }
        default:
            return baseInstruction;
    }
};

const parseCodeData = (
    codeData: any,
    projectType: 'html' | 'javascript' | 'android',
    originalContext: Project | null // Crucial for safe edits
): Partial<Message> => {
    // If we're editing but the AI didn't return a code object, we MUST return the original code.
    if (originalContext && (!codeData || typeof codeData !== 'object')) {
        codeData = {}; // Let the fallback logic below handle preserving the original code
    } else if (!codeData) {
        codeData = {}; // For new projects, default to empty object
    }

    switch (projectType) {
        case 'html': {
            // Only update if the new content is a non-empty string. Otherwise, keep the original.
            const htmlContent = (typeof codeData.html === 'string' && codeData.html.trim()) ? codeData.html : (originalContext?.htmlContent ?? '');
            
            return {
                type: 'code_generation', isCode: true,
                htmlContent,
                text: 'Generated HTML project.'
            };
        }
        case 'javascript': {
            const jsCode = (typeof codeData.javascript === 'string' && codeData.javascript.trim()) 
                ? codeData.javascript
                : (originalContext?.text?.replace(/```javascript\n|```/g, '').trim() ?? '');
            return {
                type: 'javascript_code_generation', isJavaScript: true,
                text: `\`\`\`javascript\n${jsCode}\n\`\`\``
            };
        }
        case 'android': {
             const manifestContent = (typeof codeData.manifest === 'string' && codeData.manifest.trim()) ? codeData.manifest : (originalContext?.manifestContent ?? '');
             const layoutXmlContent = (typeof codeData.layout_xml === 'string' && codeData.layout_xml.trim()) ? codeData.layout_xml : (originalContext?.layoutXmlContent ?? '');
             const activityCodeContent = (typeof codeData.main_activity_kt === 'string' && codeData.main_activity_kt.trim()) ? codeData.main_activity_kt : (originalContext?.activityCodeContent ?? '');
            return {
                type: 'android_app_generation',
                isAndroidApp: true,
                manifestContent, layoutXmlContent, activityCodeContent,
                text: 'Generated Android project files.'
            };
        }
        default:
             throw new Error(`Unknown project type for parsing: ${projectType}`);
    }
};

const parseApiResponse = (
    response: GenerateContentResponse, 
    generationMode: GenerationMode,
    isEditing: boolean,
    projectTypeForEdit?: 'HTML' | 'JavaScript' | 'Android',
    projectContext?: Project | null
): { chatText?: string, messageData: Partial<Message>, editSummary?: string } => {
    const rawText = response.text;
    if (!rawText) {
        return { messageData: { text: "Received empty response from API.", isError: true } };
    }

    // FIX: Extract reasoning block before removing it.
    let reasoningText: string | undefined;
    const reasoningRegex = /\[REASONING_START\](.*?)\[REASONING_END\]/s;
    const reasoningMatch = rawText.match(reasoningRegex);
    if (reasoningMatch && reasoningMatch[1]) {
        reasoningText = reasoningMatch[1].trim();
    }
    const contentWithoutReasoning = rawText.replace(reasoningRegex, '').trim();

    try {
        // Attempt to find and parse a JSON object from the response.
        const jsonMatch = contentWithoutReasoning.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            // If no JSON is found, and it's not an edit, treat as a simple chat response.
            if (!isEditing) {
                return { chatText: contentWithoutReasoning, messageData: { text: contentWithoutReasoning, reasoning: reasoningText } };
            }
            // If it IS an edit, we expect JSON. This is an error.
            throw new Error("Could not find a valid JSON block in the AI response for an edit.");
        }
        
        const jsonText = jsonMatch[0];
        const parsedJson = JSON.parse(jsonText);
        
        // Extract chat reply text that might be outside the JSON block.
        const chatTextOutsideJson = contentWithoutReasoning.replace(jsonText, '').trim();

        if (isEditing) {
            if (!projectTypeForEdit) throw new Error("Project type is required for parsing an edit.");
            
            const codeData = parsedJson.code;
            // The AI might put the chat reply inside or outside the JSON. Prioritize inside.
            const chatText = parsedJson.chat_reply || chatTextOutsideJson || "I've applied the changes.";
            const editSummary = parsedJson.edit_summary;

            if (!codeData) {
                throw new Error("AI response for edit is missing the 'code' object.");
            }
            
            const messageData = parseCodeData(codeData, projectTypeForEdit.toLowerCase() as any, projectContext || null);
            messageData.reasoning = reasoningText;
            return { chatText, messageData, editSummary };
        }
        
        const chatText = parsedJson.chat_reply || chatTextOutsideJson;
        const projectTitle = parsedJson.project_title;

        if (generationMode === 'project_generation') {
            const projectType = parsedJson.project_type;
            const codeData = parsedJson.code;
            if (!projectType || !codeData) throw new Error("AI response did not follow the required project structure.");
            const messageData = parseCodeData(codeData, projectType, null);
            if (projectTitle) messageData.prompt = projectTitle;
            messageData.reasoning = reasoningText;
            return { chatText, messageData };
        }

        const genType = generationMode.replace('_code_generation', '').replace('_app_generation', '') as 'html' | 'javascript' | 'android';
        const messageData = parseCodeData(parsedJson, genType, null);
        if (projectTitle) messageData.prompt = projectTitle;
        messageData.reasoning = reasoningText;
        return { chatText, messageData };

    } catch (error: any) {
        console.error("Failed to parse AI JSON response. Raw text:", rawText, "Error:", error);
        const errorMessage = `Failed to parse AI response. Error: ${error.message}. Raw output:\n\n${contentWithoutReasoning}`;
        return { messageData: { text: errorMessage, isError: true, reasoning: reasoningText } };
    }
};

export const generateProjectContent = async (options: {
    prompt: string;
    imageBase64?: string;
    generationMode: GenerationMode;
    settings: Settings;
    chatHistory: Message[];
    isEditing: boolean;
    projectContext: Project | null;
    isImageEdited: boolean;
    language: Language;
}): Promise<{ chatText?: string, messageData: Partial<Message>, editSummary?: string }> => {
    const { prompt, imageBase64, generationMode, settings, chatHistory, isEditing, projectContext, isImageEdited, language } = options;

    // FIX: Use gemini-2.5-flash instead of deprecated gemini-1.5-flash
    const model = 'gemini-2.5-flash';
    
    const systemInstruction = buildSystemInstructionForProjects(settings, generationMode, isEditing, projectContext, language);

    const contents: Content[] = [];

    // Build chat history
    if (chatHistory.length > 0) {
        chatHistory.forEach(message => {
            const parts: Part[] = [{ text: message.text }];
            if (message.attachment?.mimeType.startsWith('image/')) {
                 parts.push({
                    inlineData: {
                        mimeType: message.attachment.mimeType,
                        data: message.attachment.dataUrl.split(',')[1],
                    }
                });
            }
            contents.push({ role: message.sender === 'user' ? 'user' : 'model', parts });
        });
    }

    // Add current prompt
    const userParts: Part[] = [{ text: prompt }];
    if (imageBase64) {
        userParts.push({
            inlineData: {
                mimeType: isImageEdited ? 'image/jpeg' : 'image/png', // Assume edited is jpeg
                data: imageBase64,
            }
        });
    }
    contents.push({ role: 'user', parts: userParts });
    
    // Use projectTemperature for project tasks
    const config = {
        ...defaultGenerationConfig,
        temperature: settings.projectTemperature,
        systemInstruction,
    };
    
    const response = await ai.models.generateContent({
        model,
        contents,
        config,
    });

    const projectTypeForEdit = isEditing ? projectContext?.type : undefined;
    const result = parseApiResponse(response, generationMode, isEditing, projectTypeForEdit, projectContext);

    if (result.messageData.isError) {
        throw new Error(result.messageData.text || 'Failed to generate project content from AI response.');
    }

    return result;
};

export const generateTitle = async (prompt: string, language: Language): Promise<string> => {
    try {
        const titlePrompt = `Generate a very short, concise title (3 words max) for the following user prompt. The title should be in ${language === 'ar' ? 'Arabic' : 'English'}. Do not add quotes or any other formatting. Prompt: "${prompt}"`;
        const response = await ai.models.generateContent({
            // FIX: Use gemini-2.5-flash instead of deprecated gemini-1.5-flash
            model: 'gemini-2.5-flash',
            contents: titlePrompt,
            config: { temperature: 0.2, maxOutputTokens: 20 },
        });
        
        const generatedText = response.text;
        if (generatedText) {
            return generatedText.replace(/["']/g, "").trim();
        }
        
        console.warn("Title generation API call did not return text.");
        return "New Chat";

    } catch (error) {
        console.error("Title generation failed:", error);
        return "New Chat";
    }
};

export const generateChatStream = (options: {
    prompt: string,
    imageBase64?: string,
    settings: Settings,
    chatHistory: Message[],
    isImageEdited: boolean
}) => {
    const { prompt, imageBase64, settings, chatHistory, isImageEdited } = options;
    // FIX: Use gemini-2.5-flash instead of deprecated gemini-1.5-flash
    const model = 'gemini-2.5-flash';

    const systemInstruction = buildBaseInstruction(settings);

    const contents: Content[] = [];
    // Build chat history
    if (chatHistory.length > 0) {
        chatHistory.forEach(message => {
            const parts: Part[] = [{ text: message.text }];
            if (message.attachment?.mimeType.startsWith('image/')) {
                 parts.push({
                    inlineData: {
                        mimeType: message.attachment.mimeType,
                        data: message.attachment.dataUrl.split(',')[1],
                    }
                });
            }
            contents.push({ role: message.sender === 'user' ? 'user' : 'model', parts });
        });
    }

    // Add current prompt
    const userParts: Part[] = [{ text: prompt }];
    if (imageBase64) {
        userParts.push({
            inlineData: {
                mimeType: isImageEdited ? 'image/jpeg' : 'image/png', // Assume edited is jpeg
                data: imageBase64,
            }
        });
    }
    contents.push({ role: 'user', parts: userParts });

    const tools: any[] = [];
    if (settings.useWebSearch) {
        tools.push({ googleSearch: {} });
    }

    return ai.models.generateContentStream({
        model,
        contents,
        config: {
            ...defaultGenerationConfig,
            systemInstruction,
            tools: tools.length > 0 ? tools : undefined,
            safetySettings,
        },
    });
};

export const inspectCode = async (code: string, language: 'html' | 'javascript' | 'xml' | 'kotlin', settings: Settings): Promise<InspectionIssue[]> => {
    const prompt = `
        You are an expert code inspector. Analyze the following ${language} code for errors, potential bugs, and areas for improvement (like performance, accessibility, or best practices).
        Your response MUST be a valid JSON array of objects. Each object represents a single issue and must have the following properties:
        - "line": (number) The line number where the issue occurs.
        - "type": (string) One of: "error", "warning", or "suggestion".
        - "message": (string) A concise, clear description of the issue.

        CRITICAL: Do not include any text, explanations, or markdown formatting outside of the JSON array. Your entire response must be the JSON array itself.

        Here is the code to inspect:
        \`\`\`${language}
        ${code}
        \`\`\`
    `;

    const response = await ai.models.generateContent({
        // FIX: Use gemini-2.5-flash instead of deprecated gemini-1.5-flash
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { ...defaultGenerationConfig, temperature: 0.1, responseMimeType: 'application/json' },
    });

    try {
        const jsonText = response.text.replace(/```(json)?\n?|```/g, "").trim();
        const issues = JSON.parse(jsonText);
        if (Array.isArray(issues)) {
            return issues as InspectionIssue[];
        }
        return [];
    } catch (e) {
        console.error("Failed to parse inspection results:", e);
        throw new Error("AI Inspector returned an invalid format.");
    }
};

export const fixCode = async (code: string, issues: InspectionIssue[], language: 'html' | 'javascript' | 'xml' | 'kotlin', settings: Settings): Promise<string> => {
     const prompt = `
        You are an expert programmer. The user has provided a piece of ${language} code and a list of issues found in it.
        Your task is to fix all the issues and provide only the complete, corrected ${language} code.
        
        CRITICAL: Your response MUST contain ONLY the raw, corrected ${language} code. Do not include any explanations, comments about the changes, or markdown formatting like \`\`\`${language}\`\`\`.

        Here are the issues to fix:
        ${JSON.stringify(issues, null, 2)}

        Here is the original code to fix:
        \`\`\`${language}
        ${code}
        \`\`\`
    `;

    const response = await ai.models.generateContent({
        // FIX: Use gemini-2.5-flash instead of deprecated gemini-1.5-flash
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { ...defaultGenerationConfig, temperature: 0.1 },
    });

    return response.text.trim();
};

export const generateProjectSuggestions = async (project: Project, settings: Settings, language: Language): Promise<string[]> => {
    let projectCode;
    let projectType;
    if (project.type === 'HTML') {
        projectCode = project.htmlContent || '';
        projectType = 'HTML/CSS/JS';
    } else if (project.type === 'JavaScript') {
        projectCode = project.text?.replace(/```javascript\n|```/g, '').trim() || '';
        projectType = 'JavaScript';
    } else if (project.type === 'Android') {
        projectCode = `Manifest: ${project.manifestContent}\n\nLayout: ${project.layoutXmlContent}\n\nActivity: ${project.activityCodeContent}`;
        projectType = 'Android (Kotlin/XML)';
    } else {
        return [];
    }

    const languageName = {
        ar: 'Arabic',
        en: 'English',
        zh: 'Chinese',
        es: 'Spanish',
        fr: 'French',
        hi: 'Hindi'
    }[language] || 'English';

    const exampleText = language === 'ar' 
        ? 'مثال: ["إضافة زر للوضع الليلي", "تحريك الزر عند المرور فوقه"]'
        : 'Example: ["Add a dark mode toggle", "Animate the button on hover"]';
    
    const prompt = `
        You are an expert code reviewer and creative developer. Analyze the following project and provide a concise list of 3 actionable suggestions for improvement. The suggestions should be specific and implementable.
        CRITICAL: The suggestions MUST be in ${languageName}.
        Your response MUST be a valid JSON array of strings. Do not include any other text, explanations, or markdown formatting.
        ${exampleText}

        Original Prompt: "${project.prompt}"
        Project Type: ${projectType}
        --- START PROJECT CODE ---
        ${projectCode}
        --- END PROJECT CODE ---
    `;

    const response = await ai.models.generateContent({
        // FIX: Use gemini-2.5-flash instead of deprecated gemini-1.5-flash
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { ...defaultGenerationConfig, temperature: 0.8, responseMimeType: 'application/json' },
    });
    
    try {
        const jsonText = response.text.replace(/```(json)?\n?|```/g, "").trim();
        const suggestions = JSON.parse(jsonText);
        if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
            return suggestions;
        }
        return [];
    } catch (e) {
        console.error("Failed to parse suggestions JSON:", e);
        return [];
    }
};

export const generateAcknowledgementStream = (prompt: string, settings: Settings) => {
    // FIX: Use gemini-2.5-flash instead of deprecated gemini-1.5-flash
    const model = 'gemini-2.5-flash';
    const systemInstruction = buildBaseInstruction(settings);
    const acknowledgementPrompt = `The user wants you to create a project based on their request: "${prompt}". Your task is to provide a very short, natural, conversational acknowledgement that you are starting the process. For example: "Okay, I'll get started on that right away." or "Sure, creating that project for you now." Respond in the user's language. Do not ask questions, add any other information, or use markdown formatting.`;
    
    return ai.models.generateContentStream({
        model,
        contents: acknowledgementPrompt,
        config: {
            systemInstruction,
            temperature: 0.5,
            maxOutputTokens: 60,
            thinkingConfig: { thinkingBudget: 10 },
        },
    });
};

export const classifyIntent = async (prompt: string, project: Project, language: Language): Promise<'edit' | 'chat'> => {
    const languageName = { ar: 'Arabic', en: 'English', zh: 'Chinese', es: 'Spanish', fr: 'French', hi: 'Hindi' }[language] || 'English';
    const classificationPrompt = `
        A user is currently in a mode for editing a software project.
        The project is a "${project.type}" project with the original prompt: "${project.prompt}".
        The user has sent the following new message: "${prompt}".

        Your task is to classify the user's intent based on their message.
        - If the message is a request to modify, add to, fix, or ask something *about the code* of the project, classify it as "edit".
        - If the message is a general conversational question, a greeting, or starts a new, unrelated topic, classify it as "chat".

        Respond with a single JSON object with one key, "intent", and the value "edit" or "chat".

        Examples for "edit" (in ${languageName}): "Change the button to red", "Add a title", "Why is this not working?", "How can I make this responsive?"
        Examples for "chat" (in ${languageName}): "Hello", "What is the capital of France?", "Can you tell me about React hooks?", "Thanks"

        CRITICAL: Your entire response must be ONLY the JSON object. Example: {"intent": "edit"}
    `;
    
    const response = await ai.models.generateContent({
        // FIX: Use gemini-2.5-flash instead of deprecated gemini-1.5-flash
        model: 'gemini-2.5-flash',
        contents: classificationPrompt,
        config: { 
            temperature: 0, 
            maxOutputTokens: 20, 
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 }
        },
    });

    try {
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        if (parsed.intent === 'edit' || parsed.intent === 'chat') {
            return parsed.intent;
        }
        console.warn('Intent classification returned unexpected value:', parsed.intent);
    } catch (e) {
        console.error("Failed to parse intent classification response:", response.text, "Error:", e);
    }
    // Default to 'edit' to maintain original behavior on any failure.
    return 'edit';
};

export const generateAndroidWebPreview = async (project: Project, settings: Settings, language: Language): Promise<string> => {
    const languageName = { ar: 'Arabic', en: 'English', zh: 'Chinese', es: 'Spanish', fr: 'French', hi: 'Hindi' }[language] || 'English';
    const prompt = `
        CRITICAL INSTRUCTION: Your entire response must be ONLY the raw HTML code. Do not include any explanations, comments, or markdown formatting like \`\`\`html\`\`\`. The HTML must be a complete, self-contained document starting with <!DOCTYPE html>.

        TASK: You are an expert Android and Web developer. Convert the following Android project files into a single, **INTERACTIVE**, self-contained HTML file that visually and functionally represents the app's UI.

        CONVERSION RULES:
        - Use modern HTML and CSS to mimic Android components and layouts. Translate Android XML layouts into semantic HTML structure. Give interactive elements (like Buttons, EditTexts) a corresponding 'id' in the HTML.
        - Apply all styling within a <style> tag in the HTML's <head>. Mimic the Material Design look and feel.
        - **CRITICAL - JAVASCRIPT LOGIC:**
            - Analyze the MainActivity.kt file.
            - Convert the Kotlin logic inside the 'onCreate' method into equivalent JavaScript code.
            - Place this JavaScript inside a <script> tag at the end of the <body>, ensuring it runs after the DOM is loaded.
            - Use 'document.getElementById' to reference the HTML elements you created from the XML layout.
            - Translate Kotlin event listeners (e.g., 'setOnClickListener') into JavaScript event listeners (e.g., 'addEventListener('click', ...)')'.
            - Implement the app's functionality (like updating text, performing calculations, showing alerts) in JavaScript. For example, if a button click in Kotlin updates a TextView, the corresponding button click in JavaScript should update the text content of the corresponding <p> or <h1> tag.
            - **Simulate Android-specific UI interactions using web technologies (e.g., use 'alert()' to simulate an Android Toast).**
        - The final result should be an interactive web-based simulation of the Android app.
        - All text content in the preview should be in ${languageName}.

        ANDROID PROJECT FILES:

        --- AndroidManifest.xml ---
        ${project.manifestContent || ''}

        --- layout/activity_main.xml ---
        ${project.layoutXmlContent || ''}

        --- MainActivity.kt ---
        ${project.activityCodeContent || ''}
    `;
    
    const response = await ai.models.generateContent({
        // FIX: Use gemini-2.5-flash instead of deprecated gemini-1.5-flash
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            ...defaultGenerationConfig,
            temperature: 0.1,
        },
    });

    return response.text.trim();
};