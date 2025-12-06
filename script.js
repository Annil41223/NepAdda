
// script.js - user side logic
const APP = {
  init(){
    this.ensureData()
    this.bindSplashRedirect()
    this.carouselInit()
    this.renderNavActive()
    this.checkNotifications()
  },
  ensureData(){
    if(!localStorage.getItem('ff_data')){
      const data = {
        users: [],
        sessions: {}, // { currentUser: email }
        matches: [],
        loadRequests: [],
        withdrawRequests: [],
        notifications: {},
        joins: {} // username -> [matchIds]
      }
      localStorage.setItem('ff_data', JSON.stringify(data))
    }
  },
  getData(){ return JSON.parse(localStorage.getItem('ff_data')) },
  setData(d){ localStorage.setItem('ff_data', JSON.stringify(d)) },
  // splash auto redirect
  bindSplashRedirect(){
    const el = document.getElementById('splash-redirect')
    if(el){ setTimeout(()=>{ window.location.href='login.html' }, 1600) }
  },
  // carousel
  carouselInit(){
    const c = document.querySelector('.carousel')
    if(!c) return
    let i=0, len=c.children.length
    setInterval(()=>{ i=(i+1)%len; c.style.transform=`translateX(-${i*100}%)` }, 3500)
  },
  // nav highlight
  renderNavActive(){
    const path = location.pathname.split('/').pop()
    document.querySelectorAll('.nav-item').forEach(n=>{
      if(n.dataset.to===path) n.classList.add('active')
    })
  },
  checkNotifications(){
    const data=this.getData()
    const userEmail = data.sessions.currentUser
    if(!userEmail) return
    const notes = data.notifications[userEmail]||[]
    if(notes.length){
      alert('You have '+notes.length+' new notification(s).')
      data.notifications[userEmail]=[]
      this.setData(data)
    }
  },
  // auth helpers
  register(u){ // {username,email,phone,password,fullname,gameuid}
    const data=this.getData()
    const exists=data.users.find(x=>x.email===u.email||x.username===u.username)
    if(exists) return {ok:false,msg:'User exists'}
    data.users.push({...u,balance:0,joined:[]})
    this.setData(data)
    return {ok:true}
  },
  login({email,password}){
    const data=this.getData()
    const user=data.users.find(x=>x.email===email||x.username===email)
    if(!user) return {ok:false,msg:'Not found'}
    if(user.password!==password) return {ok:false,msg:'Wrong password'}
    data.sessions.currentUser=user.email
    this.setData(data)
    return {ok:true}
  },
  getCurrentUser(){
    const data=this.getData()
    const email=data.sessions.currentUser
    if(!email) return null
    return data.users.find(u=>u.email===email)
  },
  logout(){
    const data=this.getData()
    data.sessions.currentUser=null
    this.setData(data)
    window.location.href='login.html'
  },
  // matches
  createMatchFromAdmin(m){
    const data=this.getData()
    data.matches.unshift(m)
    this.setData(data)
  },
  joinMatch(matchId){
    const data=this.getData()
    const user = this.getCurrentUser()
    if(!user){ alert('Login first'); window.location.href='login.html'; return false }
    const match = data.matches.find(m=>m.id===matchId)
    if(!match){ alert('Match not found'); return false }
    if(user.balance < match.entryFee){ alert('Insufficient balance. Redirecting to load points'); window.location.href='wallet_load.html'; return false }
    // deduct
    user.balance -= match.entryFee
    // save join
    data.users = data.users.map(u=> u.email===user.email? user:u )
    if(!data.joins[user.email]) data.joins[user.email]=[]
    data.joins[user.email].push({matchId, ign:null, joinedAt:Date.now()})
    this.setData(data)
    // go to enter_name
    sessionStorage.setItem('joiningMatch', matchId)
    window.location.href='enter_name.html'
    return true
  },
  submitIGN(ign){
    const data=this.getData()
    const user = this.getCurrentUser()
    const matchId = sessionStorage.getItem('joiningMatch')
    if(!matchId){ alert('No match in progress'); window.location.href='games.html'; return }
    if(!data.joins[user.email]) data.joins[user.email]=[]
    const rec = data.joins[user.email].find(j=>j.matchId===matchId)
    if(rec) rec.ign = ign
    this.setData(data)
    sessionStorage.removeItem('joiningMatch')
    window.location.href='match_details.html?mid='+matchId
  },
  getMatchById(id){
    const data=this.getData()
    return data.matches.find(m=>m.id===id)
  },
  // wallet requests
  submitLoad(amount, remarks, fileName){
    const data=this.getData()
    const user=this.getCurrentUser()
    data.loadRequests.push({id:'L'+Date.now(),email:user.email,amount,remarks,fileName,status:'pending',created:Date.now()})
    this.setData(data)
    alert('Submitted Successfully. Waiting admin approval.')
    window.location.href='wallet.html'
  },
  submitWithdraw(amount,fileName){
    const data=this.getData()
    const user=this.getCurrentUser()
    if(amount<100){ alert('Minimum withdrawal is 100'); return }
    if(user.balance < amount){ alert('Insufficient balance'); return }
    data.withdrawRequests.push({id:'W'+Date.now(),email:user.email,amount,fileName,status:'pending',created:Date.now()})
    this.setData(data)
    alert('Withdraw request sent. Waiting admin approval.')
    window.location.href='wallet.html'
  }
}

document.addEventListener('DOMContentLoaded', ()=>{ APP.init() })
