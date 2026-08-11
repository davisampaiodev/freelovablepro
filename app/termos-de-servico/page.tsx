import type { Metadata } from "next";
import LegalPage from "../LegalPage";

export const metadata: Metadata = {
  title: "Termos de Serviço | FreeLovable",
  description: "Condições aplicáveis à contratação e ao uso dos serviços FreeLovable.",
};

export default function TermsOfService() {
  return (
    <LegalPage
      eyebrow="CONDIÇÕES DE USO"
      title="Termos de Serviço"
      intro="Ao contratar ou utilizar o FreeLovable, você declara ter lido e aceitado estes Termos. Leia-os com atenção antes de utilizar o serviço."
      updatedAt="11 de agosto de 2026"
      sections={[
        {
          title: "Objeto e aceitação",
          paragraphs: [<>Estes Termos regulam o acesso ao site, à extensão para navegador, às instruções, atualizações, suporte e demais recursos digitais oferecidos sob a marca FreeLovable. Se você não concordar com estas condições, não utilize o serviço.</>],
        },
        {
          title: "Elegibilidade e cadastro",
          paragraphs: [<>Você deve ter pelo menos 18 anos e capacidade legal para contratar. As informações fornecidas devem ser verdadeiras, atuais e completas. Você é responsável pela segurança de seus dados de acesso e por atividades realizadas sob sua conta ou token.</>],
        },
        {
          title: "Licença de uso",
          paragraphs: [<>Durante a vigência do plano, concedemos uma licença limitada, pessoal, revogável, não exclusiva e intransferível para utilizar o FreeLovable conforme estes Termos e as instruções fornecidas. Nenhuma titularidade sobre o software ou a marca é transferida ao usuário.</>],
        },
        {
          title: "Planos, pagamento e renovação",
          paragraphs: [
            <>Os preços, a duração e os benefícios de cada plano são informados antes da compra. O pagamento é processado por parceiro especializado e pode estar sujeito aos termos dele.</>,
            <>Quando o plano tiver renovação recorrente, a cobrança ocorrerá na periodicidade indicada até o cancelamento. Mudanças de preço serão informadas antes de produzirem efeitos sobre uma nova cobrança, quando exigido pela legislação.</>,
          ],
        },
        {
          title: "Direito de arrependimento, cancelamento e reembolso",
          paragraphs: [<>Nas compras realizadas online, o consumidor pode exercer o direito de arrependimento no prazo de 7 dias corridos a partir da contratação ou do recebimento do serviço, conforme a legislação brasileira aplicável. Para solicitar cancelamento ou reembolso, use o <a href="https://wa.me/5571983463684" target="_blank" rel="noopener noreferrer">WhatsApp oficial</a> e informe os dados usados na compra. Após esse prazo, pedidos serão avaliados conforme a lei e as condições do plano.</>],
        },
        {
          title: "Uso permitido e condutas proibidas",
          paragraphs: [<>Você se compromete a usar o serviço de forma lícita e responsável. É proibido:</>],
          items: [
            "Compartilhar, revender, sublicenciar ou comercializar o acesso sem autorização escrita.",
            "Contornar limites técnicos, controles de acesso ou medidas de segurança.",
            "Copiar, modificar, descompilar, realizar engenharia reversa ou tentar extrair o código-fonte, salvo quando a lei não permitir essa restrição.",
            "Usar automações abusivas, gerar sobrecarga, interferir no serviço ou distribuir malware.",
            "Utilizar o FreeLovable para fraude, violação de direitos, conteúdo ilegal ou qualquer finalidade proibida pela legislação.",
          ],
        },
        {
          title: "Disponibilidade, atualizações e suporte",
          paragraphs: [<>Buscamos manter o serviço disponível e atualizado, mas manutenções, falhas, mudanças de navegador ou alterações em serviços de terceiros podem causar indisponibilidade temporária. Podemos modificar recursos para preservar segurança, compatibilidade e desempenho. O suporte é prestado pelos canais oficiais divulgados no site.</>],
        },
        {
          title: "Serviços de terceiros",
          paragraphs: [<>O uso pode envolver navegadores, plataformas, meios de pagamento e outros serviços de terceiros, sujeitos aos termos e políticas próprios. O FreeLovable é um serviço independente e não é afiliado, endossado ou patrocinado pela Lovable, Meta ou por outras plataformas mencionadas, salvo indicação expressa em contrário.</>],
        },
        {
          title: "Propriedade intelectual",
          paragraphs: [<>A marca FreeLovable, o software, o design, os textos, os materiais e demais elementos do serviço são protegidos por direitos de propriedade intelectual. Marcas de terceiros pertencem aos respectivos titulares e são citadas apenas para identificação ou compatibilidade.</>],
        },
        {
          title: "Suspensão e encerramento",
          paragraphs: [<>Podemos suspender ou encerrar o acesso em caso de inadimplência, fraude, risco à segurança ou violação destes Termos, assegurados os direitos do consumidor. Você pode deixar de usar o serviço e solicitar o cancelamento do plano pelos canais oficiais.</>],
        },
        {
          title: "Responsabilidades",
          paragraphs: [<>Cada parte responde pelos danos diretos que causar nos limites da legislação. Não garantimos resultados comerciais específicos nem nos responsabilizamos por decisões tomadas exclusivamente com base no uso do serviço, por conteúdo criado pelo usuário ou por falhas de terceiros fora de nosso controle. Nada nestes Termos exclui garantias ou responsabilidades que não possam ser afastadas pela legislação de defesa do consumidor.</>],
        },
        {
          title: "Privacidade",
          paragraphs: [<>O tratamento de dados pessoais é explicado em nossa <a href="/politica-de-privacidade">Política de Privacidade</a>, que integra estes Termos.</>],
        },
        {
          title: "Alterações destes Termos",
          paragraphs: [<>Podemos atualizar estes Termos por razões legais, técnicas ou operacionais. Alterações relevantes serão comunicadas de forma adequada e não reduzirão retroativamente direitos já adquiridos pelo consumidor.</>],
        },
        {
          title: "Legislação, foro e contato",
          paragraphs: [<>Aplicam-se as leis da República Federativa do Brasil. Fica assegurado ao consumidor o foro de seu domicílio e os demais direitos previstos em lei. Para dúvidas, cancelamentos ou solicitações, fale com o <a href="https://wa.me/5571983463684" target="_blank" rel="noopener noreferrer">atendimento oficial do FreeLovable</a>.</>],
        },
      ]}
    />
  );
}
