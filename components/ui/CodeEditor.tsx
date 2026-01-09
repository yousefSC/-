
import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { xml } from '@codemirror/lang-xml';
import { java } from '@codemirror/lang-java'; // Good approximation for Kotlin

interface CodeEditorProps {
  language: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

const languageExtensions = {
  javascript: [javascript({ jsx: true })],
  html: [html()],
  css: [css()],
  xml: [xml()],
  kotlin: [java()], // Using Java for Kotlin syntax highlighting
};

const CodeEditor: React.FC<CodeEditorProps> = ({ language, value, onChange, readOnly = false }) => {
  const extensions = languageExtensions[language as keyof typeof languageExtensions] || [];

  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={vscodeDark}
      extensions={extensions}
      onChange={onChange}
      readOnly={readOnly}
      style={{
        width: '100%',
        height: '100%',
        fontSize: '14px',
      }}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        autocompletion: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
      }}
    />
  );
};

export default CodeEditor;
