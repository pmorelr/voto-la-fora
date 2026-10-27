// Matérias que citaram o Voto Lá Fora (lidas em 26/10/2026). Cada uma tem trechos da própria reportagem, parafraseados
// sem comentário nosso, e uma citação curta literal; o texto inteiro fica no link. Da mais recente para a mais antiga.

export type Materia = {
  veiculo: string;
  data: string; // AAAA-MM-DD
  titulo: string;
  autor?: string;
  url: string;
  // Mesma matéria publicada em outros sites.
  tambem?: { veiculo: string; url: string }[];
  // Paráfrase fiel de trechos da matéria, sem comentário nosso; a citação é literal.
  trecho: { pt: string; en: string };
  citacao: string;
};

export type Video = {
  veiculo: string;
  programa: string;
  data: string; // AAAA-MM-DD
  titulo: { pt: string; en: string };
  descricao: { pt: string; en: string };
  // Trecho no programa completo, no YouTube.
  original: string;
  arquivo: string; // em public/imprensa, sem extensão: .mp4, .jpg, .pt.vtt e .en.vtt
};

// Trechos dos programas, baixados do YouTube com yt-dlp e convertidos para 720p com ffmpeg, com
// legendas em português (transcrição revisada) e em inglês.
export const videos: Video[] = [
  {
    veiculo: "TV Cultura",
    programa: "Jornal da Cultura",
    data: "2026-10-17",
    titulo: { pt: "Brasileiros no exterior se organizam para reduzir a abstenção", en: "Brazilians abroad organise to bring down abstention" },
    descricao: { pt: "Reportagem com entrevista de Pedro Morel Rosa, criador do Voto Lá Fora.", en: "Report including an interview with Pedro Morel Rosa, creator of Voto Lá Fora." },
    original: "https://www.youtube.com/watch?v=YL2Eze0R5TU&t=3054s",
    arquivo: "entrevista-tv-cultura",
  },
  {
    veiculo: "ICL Notícias",
    programa: "Desperta ICL",
    data: "2026-10-13",
    titulo: { pt: "O Voto Lá Fora citado ao vivo", en: "Voto Lá Fora mentioned live on air" },
    descricao: { pt: "Comentário sobre a mobilização de brasileiros no exterior para o 2º turno.", en: "Commentary on Brazilians abroad mobilising for the 2nd round." },
    original: "https://www.youtube.com/watch?v=v5Tom6mRCkU&t=9985s",
    arquivo: "icl-noticias",
  },
];

export const materias: Materia[] = [
  {
    veiculo: "Folha de S.Paulo",
    data: "2026-10-21",
    titulo: "Distância afasta brasileiros que vivem no exterior das urnas e eleva abstenção",
    autor: "Mayara Paixão",
    url: "https://www1.folha.uol.com.br/poder/2026/10/distancia-afasta-brasileiros-que-vivem-no-exterior-das-urnas-e-eleva-abstencao.shtml",
    trecho: {
      pt: "Pedro Morel Rosa, 27, carioca que vive em Paris, criou o Voto Lá Fora, uma plataforma pública que conecta quem oferece carona até o local de votação, ou hospedagem em casa, a quem vem de longe para votar. A motivação veio do que ele viu no 1º turno: pessoas chegando com malas, recém-saídas da estação de trem, e amigos abrindo a casa para receber eleitores no 2º turno. Para ele, oferecer uma carona ou um lugar para dormir era uma forma de permitir que mais gente participasse desse momento da democracia brasileira. Até 14 de outubro, mais de 900 pessoas tinham se cadastrado.",
      en: "Pedro Morel Rosa, 27, from Rio and living in Paris, created Voto Lá Fora, a public platform connecting people who offer a ride to the polling station, or a place to stay at home, with those coming from far away to vote. The motivation came from what he saw in the 1st round: people arriving with suitcases, straight off the train, and friends opening their homes to voters for the 2nd round. To him, offering a ride or a place to sleep was a way to let more people take part in this moment of Brazilian democracy. By 14 October, more than 900 people had signed up.",
    },
    citacao: "…pessoas chegando com malas, porque haviam acabado de sair da estação de trem…",
  },
  {
    veiculo: "DW Brasil",
    data: "2026-10-16",
    titulo: "Brasileiros no exterior se mobilizam para reverter abstenção no 2º turno",
    url: "https://g1.globo.com/mundo/noticia/2026/10/17/brasileiros-no-exterior-se-mobilizam-para-reverter-abstencao-no-2o-turno.ghtml",
    tambem: [
      { veiculo: "g1", url: "https://g1.globo.com/mundo/noticia/2026/10/17/brasileiros-no-exterior-se-mobilizam-para-reverter-abstencao-no-2o-turno.ghtml" },
      { veiculo: "UOL", url: "https://noticias.uol.com.br/ultimas-noticias/deutschewelle/2026/10/16/brasileiros-no-exterior-se-mobilizam-para-reverter-abstencao-no-2-turno.htm" },
    ],
    trecho: {
      pt: "Nos Estados Unidos, duas brasileiras se conectaram pelo Voto Lá Fora: uma vai dar carona à outra até a seção de Nova York, a uma hora de casa, e nenhuma sabe a preferência eleitoral da outra. O site funciona como um mural, com anúncios de carona e hospedagem organizados por cidade, e os usuários combinam tudo diretamente. Criada por Pedro Morel dois dias depois do 1º turno, a página já reunia mais de 900 anúncios em 29 países. Ele afirma que o site é apartidário, não condiciona as vagas ao voto e que o principal esforço foi ouvir especialistas, sobretudo da área jurídica, para funcionar dentro da lei.",
      en: "In the United States, two Brazilian women connected through Voto Lá Fora: one will drive the other to the New York polling station, an hour from home, and neither knows how the other votes. The site works as a noticeboard, with ride and accommodation listings organised by city, and users arrange everything directly. Created by Pedro Morel two days after the 1st round, the page already had more than 900 listings in 29 countries. He says the site is non-partisan, never makes a place depend on someone's vote, and that the main effort was consulting experts, especially legal ones, so it would work within the law.",
    },
    citacao: "…o site possa ter lembrado algumas pessoas da importância do seu voto.",
  },
  {
    veiculo: "Valor Econômico",
    data: "2026-10-13",
    titulo: "Brasileiros criam mural de caronas e hospedagens para enfrentar abstenção alta no exterior no 2º turno",
    autor: "Anaïs Fernandes",
    url: "https://valor.globo.com/politica/eleicoes-2026/noticia/2026/10/13/brasileiros-criam-mural-de-caronas-e-hospedagens-para-enfrentar-absteno-alta-no-exterior-no-2-turno.ghtml",
    trecho: {
      pt: "Brasileiros que moram fora do país criaram um site para conectar quem pode oferecer carona ou hospedagem a quem precisa chegar à sua seção eleitoral no 2º turno. Segundo Pedro Morel Rosa, 27, que mora em Paris há seis anos e trabalha com engenharia da computação, a iniciativa é voluntária e apartidária, e as regras proíbem condicionar a carona ou a hospedagem a voto, partido, candidato ou posição política. O grupo reconhece que nem toda abstenção vem da distância: há quem não transferiu o título, quem voltou ao Brasil e, nos Estados Unidos, o medo da fiscalização migratória. O site não transporta, não hospeda nem intermedeia pagamentos, e os dados pessoais serão apagados até 15 de novembro.",
      en: "Brazilians living abroad created a website to connect people who can offer a ride or a place to stay with those who need to reach their polling station in the 2nd round. According to Pedro Morel Rosa, 27, who has lived in Paris for six years and works in computer engineering, the initiative is voluntary and non-partisan, and its rules forbid making a ride or a stay depend on someone's vote, party, candidate or political views. The group acknowledges that not all abstention comes from distance: some never transferred their registration, some have moved back to Brazil and, in the United States, there is fear of immigration checks. The site does not transport, host or handle payments, and personal data will be deleted by 15 November.",
    },
    citacao: "A iniciativa, chamada \"Voto lá fora\", é voluntária e apartidária…",
  },
  {
    veiculo: "Revista Entre Rios",
    data: "2026-10-09",
    titulo: "Eleições 2026: plataforma ajuda brasileiros no exterior a votar com ofertas de carona e hospedagem",
    autor: "Renan Araújo",
    url: "https://revistaentrerios.sapo.pt/eleicoes-2026-plataforma-ajuda-brasileiros-no-exterior-a-votar-com-ofertas-de-carona-e-hospedagem/",
    trecho: {
      pt: "Lançada para o 2º turno, a plataforma Voto Lá Fora conecta eleitores que podem oferecer carona ou hospedagem a quem precisa se deslocar para votar. Em poucos dias, já reunia mais de 400 anúncios: 107 caronas, com 309 lugares nos carros, e 300 lugares para dormir, em 49 cidades de votação de 24 países. O criador, o engenheiro de computação Pedro Morel Rosa, 27, explica que o site só coloca as pessoas em contato, sem transportar, hospedar ou intermediar pagamentos, e que dá para participar mesmo sem votar, oferecendo uma carona. A plataforma traz ainda orientações de segurança e números de emergência.",
      en: "Launched for the 2nd round, the Voto Lá Fora platform connects voters who can offer a ride or a place to stay with those who need to travel to vote. Within a few days it already had more than 400 listings: 107 rides, with 309 seats, and 300 places to sleep, in 49 voting cities across 24 countries. Its creator, computer engineer Pedro Morel Rosa, 27, explains that the site only puts people in touch, without transporting, hosting or handling payments, and that you can take part even without voting, by offering a ride. The platform also provides safety guidance and emergency numbers.",
    },
    citacao: "A plataforma foi criada pelo engenheiro de computação Pedro Morel Rosa, de 27 anos…",
  },
  {
    veiculo: "DN Brasil",
    data: "2026-10-08",
    titulo: "Busca ou quer dar carona para alguém votar em Portugal? Brasileiro cria site para conectar pessoas no segundo turno",
    autor: "Amanda Lima",
    url: "https://dnbrasil.dn.pt/eleicoes-brasil/busca-ou-quer-dar-carona-para-algum-votar-em-portugal-brasileiro-cria-site-para-conectar-pessoas-no-segundo-turno",
    trecho: {
      pt: "Quer votar no 2º turno, mas a seção é longe e precisa de carona? Ou tem lugar no carro para levar outros eleitores? O Voto Lá Fora é um mural que junta quem tem vaga no carro ou lugar para dormir com quem precisa chegar à seção em 25 de outubro, aberto a qualquer eleitor e sem perguntar em quem a pessoa vota. Para procurar, basta escolher o país e a cidade onde se vota, sem cadastro; para oferecer, informar o primeiro nome e o e-mail. Na publicação, Lisboa tinha quatro caronas, 16 vagas e dez hospedagens; o Porto, duas caronas e três hospedagens; Faro, uma carona com quatro vagas.",
      en: "Want to vote in the 2nd round, but your polling station is far away and you need a ride? Or do you have room in your car for other voters? Voto Lá Fora is a noticeboard that brings together people with a spare seat or a place to sleep and those who need to reach their polling station on 25 October, open to any voter and never asking who you vote for. To search, you just choose the country and city where you vote, without signing up; to offer, you give your first name and email. At the time of publication, Lisbon had four rides, 16 seats and ten places to stay; Porto, two rides and three places to stay; Faro, one ride with four seats.",
    },
    citacao: "O site é aberto a qualquer eleitor: ninguém pergunta em quem você vota.",
  },
  {
    veiculo: "PÚBLICO",
    data: "2026-10-08",
    titulo: "Movimento cria rede de apoio no exterior para reduzir abstenção entre brasileiros",
    autor: "Vicente Nunes",
    url: "https://www.publico.pt/2026/10/08/publico-brasil/noticia/movimento-cria-rede-apoio-exterior-reduzir-abstencao-brasileiros-2190712",
    trecho: {
      pt: "Para facilitar a vida de quem quer votar no 2º turno, foi criado o Voto Lá Fora, que estimula brasileiros que vivem no exterior a ajudar quem tem dificuldade para chegar às urnas. Uma das estratégias é a carona solidária: quem precisa de transporte vê as ofertas no site e pede uma vaga num carro. Outra é a estadia, com alguém que tenha um sofá disponível, ajuda que pode vir até de quem não vai votar. O movimento dá o exemplo de quem mora em Montpellier: cerca de 100 euros de trem até Paris e um dia inteiro entre ida, fila e volta.",
      en: "To make life easier for people who want to vote in the 2nd round, Voto Lá Fora was created, encouraging Brazilians living abroad to help those who struggle to reach the polls. One strategy is the shared ride: anyone who needs transport can see the offers on the site and ask for a seat in a car. Another is a place to stay, with someone who has a spare sofa, help that can come even from people who are not voting. The movement gives the example of someone living in Montpellier: around 100 euros by train to Paris and a whole day spent travelling, queuing and coming back.",
    },
    citacao: "O site é aberto a qualquer eleitor e só coloca as pessoas em contato.",
  },
];
