(client, callback) => {
  const name = client.fields.name;
  const data = {
    info: [
      'Metarhia is ...',
    ],
    links: [
      'Technology Stack for Highload Applications https://github.com/metarhia',
      'Code Examples https://github.com/HowProgrammingWorks',
      '',
      'Meetup Groups:',
      '- https://www.meetup.com/HowProgrammingWorks',
      '- https://www.meetup.com/NodeUA',
      '- https://www.meetup.com/KievNodeJS',
      '',
      'Telegram Groups:',
      '- https://t.me/MetarhiaHPW',
      '- https://t.me/nodeua',
      '',
      'Telegram Channels:',
      '- https://t.me/HowProgrammingWorks',
      '- https://t.me/metarhia',
    ],
    team: [
      'Metarhia team:',
      '@tshemsedinov @aqrln @belochub @nechaido @GYFK @lidaamber @lundibundi',
      '@GreatAndPowerfulKing @grimelion @DzyubSpirit @bugagashenkj @Kowalski0805',
    ]
  };
  callback({ req: client.fields, response: data[name] });
}
