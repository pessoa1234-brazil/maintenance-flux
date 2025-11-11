import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DocumentosManuaisProps {
  manualProprietarioUrl?: string;
  manualCondominioUrl?: string;
  manualUsuarioUrl?: string;
}

export const DocumentosManuais = ({
  manualProprietarioUrl,
  manualCondominioUrl,
  manualUsuarioUrl
}: DocumentosManuaisProps) => {
  const manuais = [
    {
      tipo: "Manual do Proprietário",
      url: manualProprietarioUrl,
      descricao: "Informações sobre o imóvel, garantias e especificações técnicas",
      cor: "bg-blue-500"
    },
    {
      tipo: "Manual do Condomínio",
      url: manualCondominioUrl,
      descricao: "Regras, áreas comuns e informações administrativas",
      cor: "bg-green-500"
    },
    {
      tipo: "Manual do Usuário",
      url: manualUsuarioUrl,
      descricao: "Instruções de uso e manutenção dos sistemas prediais",
      cor: "bg-purple-500"
    }
  ];

  const manuaisDisponiveis = manuais.filter(m => m.url);

  if (manuaisDisponiveis.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-2">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhum manual foi anexado a este empreendimento ainda.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {manuaisDisponiveis.map((manual) => (
        <Card key={manual.tipo}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className={`p-2 rounded-lg ${manual.cor} bg-opacity-10`}>
                <FileText className={`h-5 w-5 ${manual.cor.replace('bg-', 'text-')}`} />
              </div>
              <Badge variant="secondary">PDF</Badge>
            </div>
            <CardTitle className="text-base mt-4">{manual.tipo}</CardTitle>
            <CardDescription className="text-sm">
              {manual.descricao}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(manual.url, "_blank")}
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                const link = document.createElement("a");
                link.href = manual.url!;
                link.download = `${manual.tipo}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
