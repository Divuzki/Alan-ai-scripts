// {Name: News}
// {Description: Gives the latest headlines on topics like health, science, entertainment, sports, business, and technology. Each news headline has a corresponding image. }

title("News")

const page = 5;
const key = "7bdfb1b10aca41c6becea47611b7c35a";

let TOPICS = ["business", "entertainment", "general", "health", "science", "sports", "technology", "tech"];
let TOPICS_INTENT = [];
for (let i = 0; i < TOPICS.length; i++) {
    TOPICS_INTENT.push(TOPICS[i] + "~" + TOPICS[i]);
}
TOPICS_INTENT = TOPICS_INTENT.join('|') + '|';
let savedArticles = []
function apiCall(p, command, param, callback) {
    let jsp = {
        url: "https://studio.alan.app/api_playground/" + command,
        strictSSL: false,
        method: 'POST',
        json: param,
        timeout: 5000,
    };
    api.request(jsp, (err, res, body) => {
        if (err || res.statusCode !== 200) {
            p.play(`(Sorry|) something went wrong (on the server|) ${err} ${res} ${body}`);
        } else if (body.error) {
            p.play(body.error);
        } else {
            callback(body);
        }
    });
}

// Latest News
intent(`(show|what is|tell me|what's|what are|what're|read) (the|) (recent|latest|) $(N news|headlines) (in|about|on|) $(T~ ${TOPICS_INTENT})`,
    `(read|show|get|bring me) (the|) (recent|latest|) $(T~ ${TOPICS_INTENT}) $(N news|headlines)`,
    p => {
        let headlinesUrl = "https://newsapi.org/v2/top-headlines?country=us&apiKey=7bdfb1b10aca41c6becea47611b7c35a";
        let param = {}
        if (p.T.label) {
            param.category = p.T.label.includes("tech") ? "technology": p.T.label;
        }
        apiCall(p, 'getNews', param, response => {
            if (!response.error) {
                let headlines = [];
                let images = [];
                let res = JSON.parse(response.data);
                let articles = res.articles;
                savedArticles = articles
                p.play({
                    command: "newHeadlines",
                    title: `${p.T && p.T.label ? `${p.T.label}`: 'Latest News'}`,
                    articles: articles,
                });
                if(articles.length){
                    if (p.T && p.T.label) {
                    p.play(`Here are the (latest|recent) $(N headlines) on ${p.T.label}.`,
                        `Here's the (recent|latest) $(N news) on ${p.T.label}.`,
                        `Here are the (latest|recent) ${p.T.label} $(N headlines).`,
                        `Here's the (recent|latest) ${p.T.label} $(N news)`);
                } else {
                    p.play(`Here are the (latest|recent) $(N headlines).`,
                        `Here's the (latest|recent) $(N news).`);
                }
                    p.play('Would you like me to read the headlines?', 'Would you like me to read (them|through)')
                    p.then(confirmation)
                }else{
                    p.play(`There are no (latest|recent) headlines.`);
                }
            } else {
                console.log(response.error);
            }
        });
    });
intent(`(types|categories|topics) (of|in) the news (now|)`, `What (types|categories|topics) of news do you have?`,
    reply(`I provide news on ` + TOPICS.join(", ")));

// News By Source
intent('(Show|Give|Get) me news from $(source* (.*))', (p) => {
        if(!p.source.value){
            p.play('Please say it like show me news from cnn or fox news', 'Did not get that, try saying (Show|Give|Get) me news from cnn or fox news')
           return; 
        }
        let param = {}
        apiCall(p, 'getNews', param, response => {
            if (!response.error) {
                let res = JSON.parse(response.data);
                let articles = res.articles.filter((n)=> n.source.name === p.source.value);
                savedArticles = articles
                p.play({
                    command: "newHeadlines",
                    title: `${p.source.value} Latest News`,
                    articles: articles,
                });
                if(articles.length){
                    p.play(`Here are the (latest|recent) $(source headlines).`,
                        `Here's the (latest|recent) $(source news).`);
                    p.play('Would you like me to read the headlines?', 'Would you like me to read (them|through)')
                    p.then(confirmation)
                } else {
                    p.play(`There are no (latest|recent) news from $(source headlines).`,
                        `Sorry, but there is no news from $(source).`);
                }
               
            } else {
                console.log(response.error);
            }
        });
    });

// News By Term
intent('What\'s up with $(term* (.*))', async (p) => {
        if(!p.term.value){
            p.play('Please say that again', 'Did not get that, try saying what\'s up with Nigeria')
           return; 
        }
        let param = {}
        try {
          let res = await api.axios.get(`https://newsapi.org/v2/everything?q=${p.term.value}&apiKey=7bdfb1b10aca41c6becea47611b7c35a`)
          let articles = res.data.articles
          p.play({
                    command: "newHeadlines",
                    title: `See what's up with ${p.term.value}`,
                    articles: articles,
                })
          if(articles.length){
                    p.play(`Here are the (latest|recent) articles on $(term).`,
                        `Here's is what's up with $(term).`);
                              p.play('Would you like me to read the headlines?', 'Would you like me to read (them|through)')
                    p.then(confirmation) 
          }else{
               p.play(`There are no (latest|recent) articles on $(term).`,);
          }
            
        } catch (error) {
          console.error(error);
            p.play('Shit!, we are having problem getting to News API')
            p.play(`errors are ${error}`)
            return;
        }
            
    });

const confirmation = context(() => {
    intent('(yes|yeah)', async (p) => {
        p.play('ok, tap me if you want me to stop')
        for(let i = 0; i < savedArticles.length; i++){
            p.play({command: 'highlight', articles: savedArticles[i]});
            p.play(`${savedArticles[i].title}`)
        }
        p.play('That\'s all!', 'The end')
    })
    
    intent('(no|nah)', async (p) => {
        p.play('Sure, no problem', 'ok, i will not')
    })
})

intent('Open (article|post|div) number $(number* (.*))','Open the $(number)(st|nd|rd|th) article', (p) =>{
    if(p.number.value){
        if(savedArticles.length < 1){
            p.play(`You will need to first search for something`,
                   `You can only use this command when you have first ask for some news`)
            return;
        }
        p.play({command: 'open', number: p.number.value, articles: savedArticles})
    }else{
        p.play('Did not get what you said, try saying open article number one')
    }
})
