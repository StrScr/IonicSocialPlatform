import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import "rxjs/add/operator/map";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  currentUser: any;
  postList: AngularFireList<any>;
  posts: Observable<any>;

  visibility;

  constructor(
    public navCtrl: NavController,
    private afDB: AngularFireDatabase,
    private afAuth: AngularFireAuth
  ) {
    this.postList = afDB.list('posts', ref =>
      ref.orderByChild('score'));
    this.posts = this.postList.valueChanges().map((array) => array.reverse()) as Observable<any[]>;

    this.visibility = 'public';

    afAuth.authState.subscribe(user => {
      if (!user) {
        this.currentUser = null;
        return;
      }
      this.currentUser = {handle: null, uid: user.uid, isAnon: user.isAnonymous};
    });
  }

  signInWithGoogle() {
    this.afAuth.auth
      .signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then(res => {
        console.log(res);
        const userList = this.afDB.list('users');
        userList.update(res.user.uid, 
          {
            handle: res.user.displayName,
            uid: res.user.uid,
            isAnon: false,
            following: [],
            votes: {}
          });
      });
  }

  signOut() {
    this.afAuth.auth.signOut();
  }

  newPost(content: string,visibility: string) {
    const nPost = this.postList.push({});
    nPost.update({
      id: nPost.key,
      poster: this.currentUser.uid,
      text: content,
      vis: visibility,
      score: 0
    });
  }

  getHandle(posterid){
    let n = 'derp'
    /* this.afDB.object('users/' + posterid).snapshotChanges().subscribe(action => {
      const poster = action.payload.val();
      n = poster.handle;
    }); */
    return n;
  }

  follow(posterid) {
    //update user following
    const userList = this.afDB.list('users');
    const thisUser = this.afDB.list('users', ref => ref.orderByChild('id').equalTo(this.currentUser.uid))[0];
    if(posterid in thisUser.following){
      userList.update(this.currentUser.uid,{
        following: thisUser.following.filter(obj => obj !== posterid)
      });
    }else{
      userList.update(this.currentUser.uid,{
        following: thisUser.following.concat(posterid)
      });
    }
  }

  thumbs(postid, nscore) {
    this.afDB.object('posts/' + postid).update({
      score: nscore
    });
    /* //Update post score
    //Update user voted posts
    let diff;
    if(score!=1 && score!=-1){
      return;
    }
    const thisUserVoteRef = this.afDB.object('users/' + this.currentUser.uid + '/voted');
    let thisUserVote;
    console.log('1')
    const UserSub = thisUserVoteRef.snapshotChanges().subscribe(action => {
      thisUserVote = action.payload.val();
      UserSub.unsubscribe();
      console.log('n')
      if(thisUserVote!==null && postid in thisUserVote){
        console.log('2')
        //get previous vote
        const prev = thisUserVote[postid];
        if(prev==score){
          diff = -score;
          thisUserVoteRef.update({
            [postid]: null
          });
        }else{
          diff = score*2;
          thisUserVoteRef.update({
            [postid]: score
          });
        }
      }else{
        console.log('3')
        diff = score;
        thisUserVoteRef.update({
          [postid]: score
        });
      }
      console.log('4')
      const thisPostRef = this.afDB.object('posts/' + postid);
      let thisPost;
      const PostSub = thisPostRef.snapshotChanges().subscribe(action => {
        thisPost = action.payload.val();
        PostSub.unsubscribe()
        thisPostRef.update({
          score: thisPost.score + diff
        });
      });
      console.log('5')
    });
    console.log('6') */
  }
}
