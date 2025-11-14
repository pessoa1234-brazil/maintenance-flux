import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type UploadStage = 'idle' | 'uploading' | 'processing' | 'extracting' | 'complete' | 'error' | 'retrying';

interface ManualUploadProgressProps {
  stage: UploadStage;
  manualType: string;
  fileName?: string;
  retryCount?: number;
}

const stages = [
  { id: 'uploading', label: 'Upload do arquivo' },
  { id: 'processing', label: 'Processamento' },
  { id: 'extracting', label: 'Extração de conteúdo' },
  { id: 'complete', label: 'Concluído' },
];

export const ManualUploadProgress = ({ stage, manualType, fileName, retryCount = 0 }: ManualUploadProgressProps) => {
  if (stage === 'idle') return null;

  const currentStageIndex = stages.findIndex(s => s.id === stage);
  const progress = stage === 'complete' ? 100 : stage === 'error' ? 0 : ((currentStageIndex + 1) / stages.length) * 100;

  const getStageIcon = (stageId: string) => {
    const stageIndex = stages.findIndex(s => s.id === stageId);
    
    if (stage === 'error') {
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
    
    if (stage === 'retrying') {
      return <Loader2 className="h-5 w-5 text-warning animate-spin" />;
    }
    
    if (stageIndex < currentStageIndex || stage === 'complete') {
      return <CheckCircle2 className="h-5 w-5 text-primary" />;
    }
    
    if (stageId === stage) {
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    }
    
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <Card className={`border-primary/20 ${stage === 'error' ? 'bg-destructive/5' : 'bg-primary/5'}`}>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm">
              {stage === 'error' 
                ? 'Erro no processamento' 
                : stage === 'retrying'
                ? `Tentando novamente (${retryCount}/3)`
                : `Processando ${manualType}`
              }
            </h4>
            {fileName && (
              <p className="text-xs text-muted-foreground mt-1">{fileName}</p>
            )}
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="space-y-3">
          {stages.map((stageItem) => (
            <div key={stageItem.id} className="flex items-center gap-3">
              {getStageIcon(stageItem.id)}
              <span className={`text-sm ${
                stages.findIndex(s => s.id === stageItem.id) <= currentStageIndex || stage === 'complete'
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              }`}>
                {stageItem.label}
              </span>
            </div>
          ))}
        </div>

        {stage === 'retrying' && (
          <p className="text-sm text-warning mt-2 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Tentando processar novamente... ({retryCount} de 3 tentativas)
          </p>
        )}

        {stage === 'error' && (
          <p className="text-sm text-destructive mt-2">
            Não foi possível processar o manual após 3 tentativas. Por favor, verifique o arquivo e tente novamente.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
