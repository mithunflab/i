
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Edit3, Type, Palette, Move } from 'lucide-react';

interface ElementSelectorProps {
  onElementSelect: (elementId: string) => void;
  isActive: boolean;
}

const ElementSelector: React.FC<ElementSelectorProps> = ({ onElementSelect, isActive }) => {
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editText, setEditText] = useState('');
  const [editColor, setEditColor] = useState('#ffffff');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'elementSelected') {
        console.log('Element selected:', event.data);
        setSelectedElement(event.data);
        setEditText(event.data.elementText || '');
        setShowEditPanel(true);
        onElementSelect(event.data.elementId);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onElementSelect]);

  const handleSaveChanges = () => {
    console.log('Saving changes:', { text: editText, color: editColor });
    alert(`Changes saved! Text: "${editText}" Color: ${editColor}`);
    setShowEditPanel(false);
  };

  const handleClosePanel = () => {
    setShowEditPanel(false);
    setSelectedElement(null);
  };

  if (!isActive) return null;

  return (
    <>
      {/* Overlay indicator */}
      <div className="absolute top-2 left-2 z-50 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium">
        🎯 Click any element to edit
      </div>

      {/* Edit Panel */}
      {showEditPanel && selectedElement && (
        <div className="absolute top-4 right-4 z-50 w-80">
          <Card className="bolt-card bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm bolt-text-gradient flex items-center gap-2">
                  <Edit3 size={16} />
                  Edit {selectedElement.elementType}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClosePanel}
                  className="h-6 w-6 p-0"
                >
                  <X size={14} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                  <Type size={12} />
                  Text Content
                </label>
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Enter new text..."
                  className="bolt-input text-sm min-h-[60px]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                  <Palette size={12} />
                  Text Color
                </label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-12 h-8 p-1 bolt-input"
                  />
                  <Input
                    type="text"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    placeholder="#ffffff"
                    className="bolt-input text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveChanges}
                    className="cyber-button text-xs flex-1"
                    size="sm"
                  >
                    Apply Changes
                  </Button>
                  <Button
                    onClick={handleClosePanel}
                    variant="outline"
                    className="text-xs"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                <strong>Selected:</strong> {selectedElement.elementType}<br />
                <strong>Preview:</strong> {editText.substring(0, 30)}...
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions Toolbar */}
      {isActive && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <Card className="bolt-card bg-card/95 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-center gap-1"
                  onClick={() => alert('Template selector coming soon!')}
                >
                  <Move size={12} />
                  Templates
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-center gap-1"
                  onClick={() => alert('AI suggestions coming soon!')}
                >
                  <Type size={12} />
                  AI Suggest
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-center gap-1"
                  onClick={() => alert('Style presets coming soon!')}
                >
                  <Palette size={12} />
                  Presets
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default ElementSelector;
