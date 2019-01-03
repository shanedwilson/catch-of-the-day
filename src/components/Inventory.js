import React from 'react';
import firebase from 'firebase';
import base, { firebaseApp } from '../base';
import PropTypes from 'prop-types';
import AddFishForm from './AddFishForm';
import EditFishForm from './EditFishForm';
import Login from './Login';
import { runInThisContext } from 'vm';

class Inventory extends React.Component {
  static propTypes = {
    fishes: PropTypes.object,
    updateFish: PropTypes.func,
    deleteFish: PropTypes.func,
    loadSampleFishes: PropTypes.func
  }

  state = {
    uid: null,
    owner: null
  }

  componentDidMount() {
    firebase.auth().onAuthStateChanged(user => {
      if(user) {
        this.authHandler({ user });
      }
    })
  }

  authHandler = async authData => {
    // 1 .Look up the current store in the firebase database
    const store = await base.fetch(this.props.storeId, { context: this });
    // 2. Claim it if there is no owner
    if (!store.owner) {
      // save it as our own
      await base.post(`${this.props.storeId}/owner`, {
        data: authData.user.uid
      });
    }
   this.setState({
      uid: authData.user.uid,
      owner: store.owner || authData.user.uid
    });    
  }

  authenticate = provider => {
    const authProvider = new firebase.auth[`${provider}AuthProvider`]();
    firebaseApp
      .auth()
      .signInWithPopup(authProvider)
      .then(this.authHandler);
  };

  logout = async () => {
    console.log('Logging Out!');
    await firebase.auth().signOut;
    this.setState({ uid: null });
  }

  render() {
    const logout = <button onClick={this.logout}>Log Out!!!</button>
    if(!this.state.uid) {
      return <Login authenticate={this.authenticate} />;
    }
    if(this.state.uid !== this.state.owner) {
      return (
        <div>
          <p>Sorry, you are not the owner!</p>
          {logout}
        </div>
      );
    }
    return (
     <div className="inventory">
      <h2>Inventory!</h2>
      {logout}
      {Object.keys(this.props.fishes).map(key => (
        <EditFishForm
        key={key}
        fish={this.props.fishes[key]}
        updateFish={this.props.updateFish}
        index={key}
        deleteFish={this.props.deleteFish}
      />  
      ))}
      <AddFishForm addFish={this.props.addFish}/>
      <button onClick={this.props.loadSampleFishes}>Load Sample Fishes</button>
     </div>
    )
  }
}

export default Inventory;