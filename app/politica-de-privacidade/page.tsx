import type { Metadata } from "next";
import LegalPage from "../LegalPage";

export const metadata: Metadata = {
  title: "Política de Privacidade | FreeLovable",
  description: "Saiba como o FreeLovable coleta, utiliza e protege seus dados pessoais.",
};

export default function PrivacyPolicy() {
  return (
    <LegalPage
      eyebrow="PRIVACIDADE E PROTEÇÃO DE DADOS"
      title="Política de Privacidade"
      intro="Esta Política explica como o FreeLovable trata dados pessoais quando você visita nosso site, entra em contato, realiza uma compra ou utiliza nossos serviços."
      updatedAt="11 de agosto de 2026"
      sections={[
        {
          title: "Quem somos",
          paragraphs: [
            <>O FreeLovable oferece uma extensão para navegador e serviços digitais relacionados. Para assuntos de privacidade, solicitações e dúvidas, fale conosco pelo <a href="https://wa.me/5571983463684" target="_blank" rel="noopener noreferrer">canal oficial de atendimento no WhatsApp</a>.</>,
          ],
        },
        {
          title: "Dados que podemos coletar",
          paragraphs: [<>Coletamos somente os dados necessários para operar, melhorar e proteger nossos serviços.</>],
          items: [
            "Dados fornecidos por você, como nome, e-mail, telefone/WhatsApp e informações enviadas ao suporte.",
            "Dados de compra e assinatura, como plano, status e identificadores da transação. Os dados completos do cartão são tratados pelo provedor de pagamento e não são armazenados pelo FreeLovable.",
            "Dados técnicos e de uso, como endereço IP, navegador, dispositivo, páginas visitadas, origem da visita, data, horário e interações com o site.",
            "Cookies, pixels e identificadores de publicidade e medição, inclusive os fornecidos por Meta, Google Analytics, Microsoft Clarity e UTMify.",
            "Dados recebidos de parceiros necessários à entrega, prevenção de fraude, atendimento e confirmação do pagamento.",
          ],
        },
        {
          title: "Como utilizamos os dados",
          items: [
            "Processar pedidos, ativar e entregar o acesso contratado.",
            "Prestar suporte, enviar comunicações operacionais e responder solicitações.",
            "Gerenciar assinaturas, cobranças, reembolsos e prevenção a fraudes.",
            "Medir o desempenho do site, diagnosticar falhas e melhorar a experiência.",
            "Personalizar e mensurar campanhas de marketing, respeitando suas escolhas e a legislação aplicável.",
            "Cumprir obrigações legais, regulatórias e exercer direitos em processos administrativos ou judiciais.",
          ],
        },
        {
          title: "Bases legais",
          paragraphs: [<>Tratamos dados com fundamento na execução de contrato e procedimentos preliminares, no cumprimento de obrigação legal, no exercício regular de direitos, no legítimo interesse — após avaliação dos direitos do titular — e no consentimento, quando exigido pela Lei Geral de Proteção de Dados (LGPD).</>],
        },
        {
          title: "Cookies e tecnologias semelhantes",
          paragraphs: [
            <>Usamos tecnologias necessárias ao funcionamento do site e, conforme aplicável, ferramentas de análise e publicidade. Elas podem reconhecer seu navegador, medir conversões e ajudar a exibir anúncios mais relevantes.</>,
            <>Você pode restringir cookies nas configurações do navegador e ajustar suas preferências de anúncios nas plataformas correspondentes. O bloqueio de cookies essenciais pode afetar algumas funcionalidades.</>,
          ],
        },
        {
          title: "Compartilhamento de dados",
          paragraphs: [<>Podemos compartilhar dados estritamente necessários com provedores de hospedagem, banco de dados, atendimento, análise, publicidade, prevenção de fraude e processamento de pagamentos; com autoridades quando houver obrigação legal; ou em operação societária legítima. Não vendemos dados pessoais.</>],
        },
        {
          title: "Meta e outras plataformas",
          paragraphs: [<>Recursos da Meta, como Pixel e APIs de conversão, podem receber eventos e identificadores para medição e otimização de campanhas. A Meta trata esses dados de acordo com suas próprias políticas. O mesmo se aplica a outros serviços de terceiros identificados nesta Política.</>],
        },
        {
          title: "Armazenamento, segurança e transferências",
          paragraphs: [<>Adotamos medidas técnicas e administrativas razoáveis para proteger os dados contra acesso, perda, alteração ou divulgação indevida. Alguns fornecedores podem processar dados fora do Brasil; nesses casos, buscamos salvaguardas compatíveis com a LGPD. Nenhum sistema é absolutamente seguro.</>],
        },
        {
          title: "Prazo de retenção",
          paragraphs: [<>Mantemos dados pelo tempo necessário às finalidades descritas, à execução do contrato e ao cumprimento de prazos legais e regulatórios. Depois disso, os dados são eliminados ou anonimizados, salvo hipótese legal de conservação.</>],
        },
        {
          title: "Seus direitos",
          paragraphs: [<>Nos termos da LGPD, você pode solicitar confirmação e acesso, correção, anonimização, bloqueio ou eliminação, portabilidade quando aplicável, informação sobre compartilhamentos, revisão de decisões automatizadas e revogação do consentimento. Poderemos solicitar comprovação de identidade antes de atender ao pedido.</>],
        },
        {
          title: "Dados de crianças e adolescentes",
          paragraphs: [<>Nossos serviços não são direcionados a menores de 18 anos. Se identificarmos coleta indevida de dados de criança ou adolescente, adotaremos medidas para sua exclusão, observadas as obrigações legais.</>],
        },
        {
          title: "Exclusão de dados",
          paragraphs: [<>Para solicitar a exclusão de seus dados, entre em contato pelo <a href="https://wa.me/5571983463684" target="_blank" rel="noopener noreferrer">WhatsApp oficial</a>, informe que deseja excluir seus dados e indique o e-mail ou telefone usado no serviço. Confirmaremos sua identidade e processaremos o pedido, ressalvados os dados cuja retenção seja exigida por lei.</>],
        },
        {
          title: "Alterações e contato",
          paragraphs: [<>Esta Política pode ser atualizada para refletir mudanças legais ou operacionais. A versão vigente estará sempre nesta página, com a data de atualização. Dúvidas e solicitações podem ser encaminhadas pelo <a href="https://wa.me/5571983463684" target="_blank" rel="noopener noreferrer">canal oficial de atendimento</a>.</>],
        },
      ]}
    />
  );
}
