import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';

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
    private afAuth: AngularFireAuth,
    public alertCtrl: AlertController
  ) {
    this.postList = afDB.list('posts', ref =>
      ref.orderByChild('score'));
    this.posts = this.postList.valueChanges()
      .map(array => array.reverse()) as Observable<any[]>;
    this.visibility = 'public';

    afAuth.authState.subscribe(user => {
      if (!user) {
        this.currentUser = null;
        return;
      }
      this.currentUser = {
        handle: user.displayName,
        uid: user.uid,
        isAnon: user.isAnonymous
      };
      afDB.object('users/' + user.uid + '/following').snapshotChanges().subscribe(action => {
        if(!action){
          return;
        }
        this.currentUser['following'] = action.payload.val();
        console.log(this.currentUser.following)
      })
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
            isAnon: false
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
      posterName: this.currentUser.handle,
      text: content,
      vis: visibility,
      score: 0
    });
  }

  /* getHandle(posterid: string){
    let n: string = 'Generic';
    this.afDB.object('users/' + posterid).snapshotChanges().subscribe(action => {
      const poster = action.payload.val();
      n = poster.handle;
    });
    return n;
  } */

  follow(posterid) {
    //update user following
    if(!this.currentUser){
      this.showAlert('Alert','Please log in.');
      return;
    }
    if(posterid==this.currentUser.uid){
      this.showAlert('Impossible!','Can\'t follow yourself!');
      return;
    }
    const thisUserFollow = this.afDB.object('users/' + this.currentUser.uid + '/following');
    thisUserFollow.update({
      [posterid]: true
    });
  }

  thumbs(postid, nscore) {
    if(!this.currentUser){
      this.showAlert('Alert','Please log in.');
      return;
    }
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

  showAlert(aTitle: string, aSub: string){
    let alert = this.alertCtrl.create({
      title: aTitle,
      subTitle: aSub,
      buttons: ['OK']
    });
    alert.present();
  }

  shouldHide(post): boolean{
    const disp: boolean = (post.vis == 'public') ||
      (!!this.currentUser &&
        ((post.poster == this.currentUser.uid) ||
        (post.vis == 'followers' &&
          (!!this.currentUser.following && this.currentUser.following[post.poster]))));
    //console.log(post.vis+','+disp)
    return !disp;
  }
}
