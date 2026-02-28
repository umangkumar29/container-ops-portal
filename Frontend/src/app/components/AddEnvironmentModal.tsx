import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Box, Globe, Server, Tag, Layers } from 'lucide-react';
import { motion } from 'motion/react';

export interface EnvironmentData {
  name: string;
  type: 'PROD' | 'QA' | 'DEV' | 'INTEGRATION';
  resourceGroup: string;
  frontendName: string;
  backendName: string;
}

interface AddEnvironmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: EnvironmentData) => void;
}

const ENV_TYPES = [
  { value: 'PROD', label: 'Production', color: 'border-red-500/30 text-red-400 bg-red-500/10 data-[selected]:bg-red-500/20 data-[selected]:border-red-500/60' },
  { value: 'QA', label: 'QA / Staging', color: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10 data-[selected]:bg-yellow-500/20 data-[selected]:border-yellow-500/60' },
  { value: 'DEV', label: 'Development', color: 'border-blue-500/30 text-blue-400 bg-blue-500/10 data-[selected]:bg-blue-500/20 data-[selected]:border-blue-500/60' },
  { value: 'INTEGRATION', label: 'Integration', color: 'border-purple-500/30 text-purple-400 bg-purple-500/10 data-[selected]:bg-purple-500/20 data-[selected]:border-purple-500/60' },
] as const;

export function AddEnvironmentModal({ open, onOpenChange, onSave }: AddEnvironmentModalProps) {
  const [formData, setFormData] = useState<EnvironmentData>({
    name: '',
    type: 'DEV',
    resourceGroup: '',
    frontendName: '',
    backendName: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({ name: '', type: 'DEV', resourceGroup: '', frontendName: '', backendName: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-[580px] p-0 overflow-hidden gap-0 shadow-2xl">
        {/* Header accent */}
        <div className="h-1 w-full bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#6366F1]" />

        <div className="p-6 space-y-5">
          <DialogHeader className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.2)]">
                <Box className="w-5 h-5 text-[#6366F1]" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Add New Environment
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Link Azure Container Apps for unified restart control
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Environment Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3 h-3" />
                Environment Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder='e.g., "KPIT GM QA" or "Production"'
                value={formData.name}
                onChange={handleChange}
                className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-[#6366F1] focus-visible:border-[#6366F1] transition-all duration-200"
                required
              />
            </div>

            {/* Environment Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3 h-3" />
                Environment Type
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ENV_TYPES.map(t => (
                  <motion.button
                    key={t.value}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setFormData(prev => ({ ...prev, type: t.value }))}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all duration-200 cursor-pointer ${t.color} ${
                      formData.type === t.value ? 'ring-2 ring-offset-1 ring-offset-card ring-current' : ''
                    }`}
                    data-selected={formData.type === t.value ? '' : undefined}
                  >
                    {t.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Azure Details Group */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 rounded bg-[rgba(99,102,241,0.1)]">
                  <Box className="w-3 h-3 text-[#6366F1]" />
                </div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Azure Configuration</h3>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="resourceGroup" className="text-xs font-medium text-foreground">
                    Resource Group
                  </Label>
                  <Input
                    id="resourceGroup"
                    name="resourceGroup"
                    placeholder='e.g., "rg-kpit-gm-qa"'
                    value={formData.resourceGroup}
                    onChange={handleChange}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-[#6366F1] focus-visible:border-[#6366F1]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="frontendName" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-[#6366F1]" />
                      Frontend App Name
                    </Label>
                    <Input
                      id="frontendName"
                      name="frontendName"
                      placeholder='e.g., "kpit-gm-qa-frontend"'
                      value={formData.frontendName}
                      onChange={handleChange}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-[#6366F1] focus-visible:border-[#6366F1]"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="backendName" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Server className="w-3 h-3 text-[#10B981]" />
                      Backend App Name
                    </Label>
                    <Input
                      id="backendName"
                      name="backendName"
                      placeholder='e.g., "kpit-gm-qa-backend"'
                      value={formData.backendName}
                      onChange={handleChange}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-[#6366F1] focus-visible:border-[#6366F1]"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-1 gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#6366F1] hover:bg-[#5558E3] text-white shadow-lg shadow-[rgba(99,102,241,0.25)] border-none font-medium transition-all duration-200 cursor-pointer px-6"
              >
                Add Environment
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
