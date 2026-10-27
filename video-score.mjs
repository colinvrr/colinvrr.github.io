// Shuffle bags guarantee a complete tour; a recent-history window also prevents
// quick repeats across the boundary between two bags.
export class WorldDeck {
 constructor(count,{random=Math.random,start=1,recent=8}={}){
  if(count<2)throw Error('At least two video styles are required');
  this.count=count;this.random=random;this.cooldown=Math.min(recent,count-1);this.history=[start];
  this.bag=Array.from({length:count},(_,i)=>i).filter(i=>i!==start);
 }
 next(){
  if(!this.bag.length)this.bag=Array.from({length:this.count},(_,i)=>i);
  const eligible=this.bag.map((id,index)=>({id,index})).filter(({id})=>!this.history.includes(id));
  const choice=eligible[Math.min(eligible.length-1,Math.floor(this.random()*eligible.length))];
  this.bag.splice(choice.index,1);this.history.push(choice.id);if(this.history.length>this.cooldown)this.history.shift();return choice.id;
 }
}
