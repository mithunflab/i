
interface EditResult {
  success: boolean;
  modifiedCode?: string;
  error?: string;
  changesSummary?: string;
}

export class AIEditor {
  applyComponentEdit(intent: any, htmlContent: string): EditResult {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");
      const target = doc.getElementById(intent.targetComponentId) || 
                     doc.querySelector(`.${intent.targetComponentId}`);

      if (!target) {
        return {
          success: false,
          error: `Component with ID "${intent.targetComponentId}" not found`
        };
      }

      const originalHTML = target.outerHTML;
      let changesMade = [];

      // Apply style updates
      if (intent.updates.style) {
        Object.entries(intent.updates.style).forEach(([property, value]) => {
          target.style[property] = value as string;
          changesMade.push(`${property}: ${value}`);
        });
      }

      // Apply class updates
      if (intent.updates.addClass) {
        target.classList.add(intent.updates.addClass);
        changesMade.push(`Added class: ${intent.updates.addClass}`);
      }

      if (intent.updates.removeClass) {
        target.classList.remove(intent.updates.removeClass);
        changesMade.push(`Removed class: ${intent.updates.removeClass}`);
      }

      // Apply content updates
      if (intent.updates.content) {
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          target.setAttribute('value', intent.updates.content);
        } else {
          target.textContent = intent.updates.content;
        }
        changesMade.push(`Content updated to: ${intent.updates.content}`);
      }

      // Apply attribute updates
      if (intent.updates.attributes) {
        Object.entries(intent.updates.attributes).forEach(([attr, value]) => {
          target.setAttribute(attr, value as string);
          changesMade.push(`${attr}: ${value}`);
        });
      }

      return {
        success: true,
        modifiedCode: target.outerHTML,
        changesSummary: changesMade.join(', ')
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to apply edit: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  generateFullPageWithEdit(originalHTML: string, modifiedComponentHTML: string, componentId: string): string {
    // Replace the component in the full HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(originalHTML, "text/html");
    const target = doc.getElementById(componentId) || doc.querySelector(`.${componentId}`);

    if (target && target.parentNode) {
      const newElement = parser.parseFromString(modifiedComponentHTML, "text/html").body.firstChild;
      if (newElement) {
        target.parentNode.replaceChild(doc.importNode(newElement, true), target);
      }
    }

    return doc.documentElement.outerHTML;
  }

  validateEdit(originalCode: string, modifiedCode: string): boolean {
    try {
      // Basic validation - ensure both parse correctly
      const parser = new DOMParser();
      const originalDoc = parser.parseFromString(originalCode, "text/html");
      const modifiedDoc = parser.parseFromString(modifiedCode, "text/html");

      // Check for parsing errors
      const originalErrors = originalDoc.querySelector('parsererror');
      const modifiedErrors = modifiedDoc.querySelector('parsererror');

      if (originalErrors || modifiedErrors) {
        return false;
      }

      // Ensure structure integrity
      const originalElements = originalDoc.querySelectorAll('*').length;
      const modifiedElements = modifiedDoc.querySelectorAll('*').length;

      // Allow for small differences in element count (due to style attributes, etc.)
      return Math.abs(originalElements - modifiedElements) <= 5;

    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }

  extractComponentFromHTML(html: string, componentId: string): string | null {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const target = doc.getElementById(componentId) || doc.querySelector(`.${componentId}`);
      
      return target ? target.outerHTML : null;
    } catch (error) {
      console.error('Failed to extract component:', error);
      return null;
    }
  }
}

export const aiEditor = new AIEditor();
