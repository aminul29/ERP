import React, { useEffect, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// Lightweight rich text editor using contentEditable and execCommand for basic formatting
export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Only update innerHTML if it differs to avoid caret jumps while typing
    if (ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const apply = (command: string) => {
    document.execCommand(command, false);
    // After applying formatting, propagate change
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // Paste as plain text to avoid messy HTML
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg">
      <div className="flex items-center p-1.5 border-b border-gray-600 space-x-1">
        <button type="button" onClick={() => apply('bold')} className="px-2 py-1 rounded hover:bg-gray-700 text-gray-300 font-bold text-sm">B</button>
        <button type="button" onClick={() => apply('italic')} className="px-2 py-1 rounded hover:bg-gray-700 text-gray-300 italic text-sm">I</button>
        <button type="button" onClick={() => apply('underline')} className="px-2 py-1 rounded hover:bg-gray-700 text-gray-300 underline text-sm">U</button>
        <span className="mx-2 w-px h-4 bg-gray-600" />
        <button type="button" onClick={() => apply('insertUnorderedList')} className="px-2 py-1 rounded hover:bg-gray-700 text-gray-300 text-sm">• List</button>
        <button type="button" onClick={() => apply('insertOrderedList')} className="px-2 py-1 rounded hover:bg-gray-700 text-gray-300 text-sm">1. List</button>
      </div>
      <div
        ref={ref}
        className="w-full p-2 bg-gray-800 rounded-b-lg border-none focus:outline-none min-h-[100px] text-white"
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder || ''}
        suppressContentEditableWarning
      />
      <style>
        {`
          [contenteditable][data-placeholder]:empty:before {
            content: attr(data-placeholder);
            color: #9CA3AF; /* gray-400 */
          }
        `}
      </style>
    </div>
  );
};

