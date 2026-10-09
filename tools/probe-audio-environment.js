(async()=>{
 const game=testGame,S=game.getSceneStack().getCurrentScene();
 const result={secureContext:isSecureContext,audioEncoder:typeof AudioEncoder,audioData:typeof AudioData,audioContext:typeof AudioContext,howler:typeof Howler,soundManager:S.getSoundManager().constructor.name};
 if(typeof AudioEncoder!=='undefined')result.opus=(await AudioEncoder.isConfigSupported({codec:'opus',sampleRate:48000,numberOfChannels:2,bitrate:112000})).supported;
 result.state={scene:S.getName(),wave:S.getVariables().get('Wave').getAsNumber(),roster:Object.keys(S.getVariables().get('EnemyTypes').toJSObject()),waypoints:S.getVariables().get('MonsterPathPointCount').getAsNumber(),shop:S.__towerShopUI.cards.length};
 return result;
})()
