chrome.runtime.onMessage.addListener((t,n,o)=>(o(t),!0));class Mat{constructor(t,o){this.nrow=t,this.ncol=o,this.data=new Float64Array(n*d)}sigm(){for(let t=0;t<this.data.length;t++)this.data[t]=1/(1+Math.exp(-this.data[t]));return this}mul(t){if(this.ncol!=t.nrow)throw new Error(`dimention not match ${this.nrow}x${this.ncol} * ${t.nrow}x${t.ncol}`)}}
//# sourceMappingURL=model.js.map