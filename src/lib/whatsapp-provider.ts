type MessageInput = {
  nome: string | null;
  plano: string | null;
};

function firstName(nome: string | null) {
  return nome?.trim().split(/\s+/)[0] || "tudo bem";
}

function planLabel(plano: string | null) {
  if (!plano) return "FreeLovable";
  return `plano ${plano}`;
}

export function buildFormularioSemCheckoutMessage({ nome, plano }: MessageInput) {
  return `Oi, ${firstName(nome)}! Vi que voce preencheu o formulario do FreeLovable para o ${planLabel(plano)}, mas ainda nao iniciou o checkout. Posso te ajudar a finalizar?`;
}

export function buildCheckoutIniciadoMessage({ nome, plano }: MessageInput) {
  return `Oi, ${firstName(nome)}! Vi que voce iniciou o checkout do FreeLovable para o ${planLabel(plano)}, mas ainda nao gerou o Pix. Quer que eu te ajude?`;
}

export function buildPixAbandonadoMessage({ nome, plano }: MessageInput) {
  return `Oi, ${firstName(nome)}! Seu Pix do FreeLovable para o ${planLabel(plano)} foi gerado, mas ainda nao identificamos o pagamento. Posso te mandar o link novamente?`;
}

export function sendWhatsAppMock({
  telefone,
  mensagem,
  tipo,
}: {
  telefone: string;
  mensagem: string;
  tipo: string;
}) {
  return {
    provider: "mock",
    sent: false,
    tipo,
    telefone,
    mensagem,
  };
}
