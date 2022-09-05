intent('who created you?', 'who made you?',
      reply('I was created by Divuzki for an hackathon.'));

intent('who are your creators?', 'name the team that created you',
      reply('I was created by Divuzki, one person, so i belive you ment creator.'));

intent(`What does this app do?`, `How does this work?`, `What can I do here?`, `How should I use this?`, `What can you do?`,
    reply(`(This is a news project, and|) (you can get |I can provide) the most recent headlines in mainstream media` +
        ` Just ask me anything about the news, bitcoin, current date, weather in your area and i can also calculate for you, and I will try to answer it`));

intent('(go|take me|carry me) (back|home)','leave here', (p) => {
    p.play('ok, taking you back to the index page')
    p.play({command: "newHeadlines", articles: []});
})

intent('Alan', (p)=>{
    p.play("Yes, how may i help you")
})