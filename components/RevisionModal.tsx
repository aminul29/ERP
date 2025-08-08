import React, { useState } from 'react';
import { Modal } from './ui/Modal';

interface RevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (revisionMessage: string) => void;
  taskTitle: string;
}

export const RevisionModal: React.FC<RevisionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  taskTitle
}) => {
  const [revisionText, setRevisionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionText.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(revisionText.trim());
      setRevisionText('');
      onClose();
    } catch (error) {
      console.error('Error submitting revision:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRevisionText('');
    onClose();
  };

  // Rich text editor toolbar functions
  const insertFormatting = (before: string, after: string = '') => {
    const textarea = document.getElementById('revision-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = revisionText.substring(start, end);
    const beforeText = revisionText.substring(0, start);
    const afterText = revisionText.substring(end);

    const newText = beforeText + before + selectedText + after + afterText;
    setRevisionText(newText);

    // Reset focus and cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertBulletPoint = () => {
    const textarea = document.getElementById('revision-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const beforeText = revisionText.substring(0, start);
    const afterText = revisionText.substring(start);

    // Check if we're at the beginning of a line
    const isNewLine = start === 0 || revisionText[start - 1] === '\n';
    const prefix = isNewLine ? '• ' : '\n• ';
    
    const newText = beforeText + prefix + afterText;
    setRevisionText(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertNumberedPoint = () => {
    const textarea = document.getElementById('revision-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const beforeText = revisionText.substring(0, start);
    const afterText = revisionText.substring(start);

    // Count existing numbered points to determine next number
    const lines = beforeText.split('\n');
    let nextNumber = 1;
    for (const line of lines) {
      const match = line.match(/^\s*(\d+)\./);
      if (match) {
        nextNumber = Math.max(nextNumber, parseInt(match[1]) + 1);
      }
    }

    const isNewLine = start === 0 || revisionText[start - 1] === '\n';
    const prefix = isNewLine ? `${nextNumber}. ` : `\n${nextNumber}. `;
    
    const newText = beforeText + prefix + afterText;
    setRevisionText(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Request Task Revision">
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-gray-300">
          Requesting revision for: <span className="font-semibold text-white">{taskTitle}</span>
        </p>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Revision Feedback <span className="text-red-400">*</span>
          </label>
          
          {/* Rich Text Editor Toolbar */}
          <div className="bg-gray-800 border border-gray-600 rounded-t-lg">
            <div className="flex items-center p-2 border-b border-gray-600 space-x-1">
              <button
                type="button"
                onClick={() => insertFormatting('**', '**')}
                className="px-3 py-1 rounded hover:bg-gray-700 text-gray-300 font-bold text-sm transition-colors"
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*')}
                className="px-3 py-1 rounded hover:bg-gray-700 text-gray-300 italic text-sm transition-colors"
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('`', '`')}
                className="px-3 py-1 rounded hover:bg-gray-700 text-gray-300 font-mono text-sm transition-colors"
                title="Code"
              >
                {'</>'}
              </button>
              <div className="w-px h-6 bg-gray-600 mx-1"></div>
              <button
                type="button"
                onClick={insertBulletPoint}
                className="px-3 py-1 rounded hover:bg-gray-700 text-gray-300 text-sm transition-colors"
                title="Bullet Point"
              >
                •
              </button>
              <button
                type="button"
                onClick={insertNumberedPoint}
                className="px-3 py-1 rounded hover:bg-gray-700 text-gray-300 text-sm transition-colors"
                title="Numbered List"
              >
                1.
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('> ')}
                className="px-3 py-1 rounded hover:bg-gray-700 text-gray-300 text-sm transition-colors"
                title="Quote"
              >
                " "
              </button>
            </div>
            
            {/* Text Area */}
            <textarea
              id="revision-textarea"
              value={revisionText}
              onChange={(e) => setRevisionText(e.target.value)}
              placeholder="Provide detailed feedback on what needs to be revised. Be specific about the changes required..."
              className="w-full p-4 bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none min-h-[200px]"
              required
              disabled={isSubmitting}
            />
          </div>
          
          {/* Character count and tips */}
          <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
            <span>
              {revisionText.length} characters
            </span>
            <span>
              Tip: Use formatting tools for better readability
            </span>
          </div>
        </div>

        {/* Common revision templates */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quick Templates (Click to insert)
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRevisionText(revisionText + (revisionText ? '\n\n' : '') + '**Issues Found:**\n• \n\n**Required Changes:**\n• \n\n**Expected Outcome:**\n• ')}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
            >
              Standard Review
            </button>
            <button
              type="button"
              onClick={() => setRevisionText(revisionText + (revisionText ? '\n\n' : '') + '**Quality Issues:**\n• Code quality needs improvement\n• Documentation is missing\n• Testing is insufficient\n\n**Please address these before resubmission.**')}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
            >
              Quality Check
            </button>
            <button
              type="button"
              onClick={() => setRevisionText(revisionText + (revisionText ? '\n\n' : '') + '**Requirements Not Met:**\n• \n\n**Missing Features:**\n• \n\n**Please implement the above and resubmit.**')}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
            >
              Requirements
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!revisionText.trim() || isSubmitting}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Request Revision'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
