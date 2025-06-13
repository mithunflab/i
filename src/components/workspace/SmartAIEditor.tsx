
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, 
  Target, 
  Code, 
  Eye, 
  History, 
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ComponentMapEntry {
  id: string;
  file: string;
  selector: string;
  type: string;
}

interface DesignToken {
  primaryColor: string;
  fontFamily: string;
  fontSizeBase: string;
  spacing: string;
}

interface EditIntent {
  targetComponentId: string;
  file: string;
  action: 'style_update' | 'content_update' | 'structure_update';
  updates: {
    addClass?: string;
    removeClass?: string;
    style?: Record<string, string>;
    content?: string;
    attributes?: Record<string, string>;
  };
}

interface SmartAIEditorProps {
  currentCode: string;
  onCodeUpdate: (newCode: string) => void;
  projectId: string;
}

const SmartAIEditor: React.FC<SmartAIEditorProps> = ({ 
  currentCode, 
  onCodeUpdate, 
  projectId 
}) => {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [componentMap, setComponentMap] = useState<Record<string, ComponentMapEntry>>({});
  const [designTokens, setDesignTokens] = useState<DesignToken>({
    primaryColor: '#FF6600',
    fontFamily: 'Inter, sans-serif',
    fontSizeBase: '16px',
    spacing: '12px'
  });
  const [editHistory, setEditHistory] = useState<Array<{
    timestamp: Date;
    description: string;
    component: string;
  }>>([]);
  const { toast } = useToast();

  // Parse components from HTML
  useEffect(() => {
    if (currentCode) {
      parseComponents(currentCode);
    }
  }, [currentCode]);

  const parseComponents = (htmlContent: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const components: Record<string, ComponentMapEntry> = {};

    // Find elements with IDs
    const elementsWithIds = doc.querySelectorAll('[id]');
    elementsWithIds.forEach(element => {
      const id = element.id;
      const tagName = element.tagName.toLowerCase();
      
      components[id] = {
        id,
        file: 'index.html',
        selector: `#${id}`,
        type: determineComponentType(id, tagName, element.className)
      };
    });

    // Find semantic components
    const semanticSelectors = [
      { selector: 'header', type: 'header', id: 'main-header' },
      { selector: 'nav', type: 'navigation', id: 'main-nav' },
      { selector: 'footer', type: 'footer', id: 'main-footer' },
      { selector: '.hero', type: 'hero', id: 'hero-section' },
      { selector: '.video-gallery', type: 'video', id: 'video-gallery' }
    ];

    semanticSelectors.forEach(({ selector, type, id }) => {
      const element = doc.querySelector(selector);
      if (element && !components[id]) {
        components[id] = {
          id,
          file: 'index.html',
          selector,
          type
        };
      }
    });

    setComponentMap(components);
  };

  const determineComponentType = (id: string, tagName: string, className: string): string => {
    const combined = (id + tagName + className).toLowerCase();
    
    if (combined.includes('header')) return 'header';
    if (combined.includes('hero') || combined.includes('banner')) return 'hero';
    if (combined.includes('nav') || combined.includes('menu')) return 'navigation';
    if (combined.includes('footer')) return 'footer';
    if (combined.includes('btn') || combined.includes('button')) return 'button';
    if (combined.includes('video') || combined.includes('gallery')) return 'video';
    
    return 'content';
  };

  const parseUserIntent = (input: string): EditIntent | null => {
    const lowerInput = input.toLowerCase();
    
    // Find target component
    let targetComponent: string | null = null;
    for (const [componentId, component] of Object.entries(componentMap)) {
      if (lowerInput.includes(componentId.toLowerCase().replace('-', ' ')) ||
          lowerInput.includes(component.type)) {
        targetComponent = componentId;
        break;
      }
    }

    if (!targetComponent) {
      // Try to infer from keywords
      if (lowerInput.includes('button') || lowerInput.includes('subscribe')) {
        targetComponent = 'cta-btn';
      } else if (lowerInput.includes('header') || lowerInput.includes('title')) {
        targetComponent = 'main-header';
      } else if (lowerInput.includes('hero') || lowerInput.includes('banner')) {
        targetComponent = 'hero-section';
      }
    }

    if (!targetComponent) return null;

    const component = componentMap[targetComponent];
    if (!component) return null;

    // Determine action and updates
    const updates: EditIntent['updates'] = {};
    let action: EditIntent['action'] = 'style_update';

    // Parse style changes
    if (lowerInput.includes('bigger') || lowerInput.includes('larger')) {
      updates.addClass = 'text-lg';
      updates.style = { fontSize: '1.2em' };
    }
    if (lowerInput.includes('smaller')) {
      updates.addClass = 'text-sm';
      updates.style = { fontSize: '0.9em' };
    }
    if (lowerInput.includes('red')) {
      updates.style = { color: '#ff0000' };
    }
    if (lowerInput.includes('blue')) {
      updates.style = { color: '#0066cc' };
    }
    if (lowerInput.includes('green')) {
      updates.style = { color: '#00cc66' };
    }

    // Parse content changes
    const textMatch = input.match(/(?:text|content).*?["']([^"']+)["']/i);
    if (textMatch) {
      updates.content = textMatch[1];
      action = 'content_update';
    }

    return {
      targetComponentId: targetComponent,
      file: component.file,
      action,
      updates
    };
  };

  const applyEdit = (intent: EditIntent, htmlContent: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const target = doc.getElementById(intent.targetComponentId) ||
                   doc.querySelector(`.${intent.targetComponentId}`);

    if (!target) {
      console.warn(`Component ${intent.targetComponentId} not found`);
      return htmlContent;
    }

    // Apply style updates
    if (intent.updates.style) {
      Object.entries(intent.updates.style).forEach(([property, value]) => {
        target.style[property] = value;
      });
    }

    // Apply class updates
    if (intent.updates.addClass) {
      target.classList.add(intent.updates.addClass);
    }
    if (intent.updates.removeClass) {
      target.classList.remove(intent.updates.removeClass);
    }

    // Apply content updates
    if (intent.updates.content) {
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        target.setAttribute('value', intent.updates.content);
      } else {
        target.textContent = intent.updates.content;
      }
    }

    // Apply attribute updates
    if (intent.updates.attributes) {
      Object.entries(intent.updates.attributes).forEach(([attr, value]) => {
        target.setAttribute(attr, value);
      });
    }

    return doc.documentElement.outerHTML;
  };

  const handleSmartEdit = async () => {
    if (!userInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe what you want to change",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const intent = parseUserIntent(userInput);
      
      if (!intent) {
        toast({
          title: "Unable to Parse Request",
          description: "Please be more specific about which component to modify",
          variant: "destructive",
        });
        return;
      }

      const updatedCode = applyEdit(intent, currentCode);
      onCodeUpdate(updatedCode);

      // Log the edit
      const editRecord = {
        timestamp: new Date(),
        description: userInput,
        component: intent.targetComponentId
      };
      setEditHistory(prev => [editRecord, ...prev.slice(0, 9)]); // Keep last 10

      toast({
        title: "Smart Edit Applied",
        description: `Successfully modified ${intent.targetComponentId}`,
      });

      setUserInput('');
    } catch (error) {
      console.error('Smart edit error:', error);
      toast({
        title: "Edit Failed",
        description: "Unable to apply the requested changes",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const quickActions = [
    { label: 'Make button bigger', icon: '🔍' },
    { label: 'Change header color to blue', icon: '🎨' },
    { label: 'Update hero title text', icon: '✏️' },
    { label: 'Add hover effect to videos', icon: '✨' }
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-purple-500" />
          Smart AI Editor
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Component-Level
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Component Map Display */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Editable Components ({Object.keys(componentMap).length})
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(componentMap).slice(0, 6).map(([id, component]) => (
              <Badge 
                key={id} 
                variant="outline" 
                className="text-xs justify-start"
              >
                {component.type}: {id}
              </Badge>
            ))}
          </div>
        </div>

        {/* Smart Input */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Natural Language Edit</h4>
          <Textarea
            placeholder="Describe what you want to change... e.g., 'Make the subscribe button bigger and red'"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="min-h-[80px]"
          />
          <Button 
            onClick={handleSmartEdit}
            disabled={isProcessing || !userInput.trim()}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Apply Smart Edit
              </>
            )}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Quick Actions</h4>
          <div className="grid grid-cols-1 gap-1">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="justify-start text-left h-8"
                onClick={() => setUserInput(action.label)}
              >
                <span className="mr-2">{action.icon}</span>
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Edit History */}
        {editHistory.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Edits
            </h4>
            <ScrollArea className="h-24">
              <div className="space-y-1">
                {editHistory.map((edit, index) => (
                  <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                    <div className="font-medium">{edit.component}</div>
                    <div className="text-gray-600">{edit.description}</div>
                    <div className="text-gray-400">{edit.timestamp.toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Design Tokens */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Design System
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Color: {designTokens.primaryColor}</div>
            <div>Font: {designTokens.fontSizeBase}</div>
            <div>Spacing: {designTokens.spacing}</div>
            <div>Family: Inter</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartAIEditor;
