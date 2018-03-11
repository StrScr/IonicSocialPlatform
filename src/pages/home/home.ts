import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  currentUser: any;

  constructor(
    public navCtrl: NavController,
    afDB: AngularFireDatabase,
    private afAuth: AngularFireAuth
  ) {
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
      .then(res => console.log(res));

  }

  signOut() {
    this.afAuth.auth.signOut();
  }
}
