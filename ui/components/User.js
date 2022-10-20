import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import ExtensionPointSchemaValidator from '../utils/ExtensionPointSchemaValidator';
import Avatar from '@material-ui/core/Avatar';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Link from "next/link";
import MenuList from '@material-ui/core/MenuList';
import Grow from '@material-ui/core/Grow';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemText from "@material-ui/core/ListItemText";
import Popper from '@material-ui/core/Popper';
import Paper from '@material-ui/core/Paper';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import NoSsr from '@material-ui/core/NoSsr';
import { withRouter } from 'next/router';
import dataFetch from '../lib/data-fetch';
import { updateUser } from '../lib/store';
import classNames from 'classnames';
import { ListItem, List } from '@material-ui/core';


const styles = () => ({
  popover : { color : 'black', },
  link : {
    display : "inline-flex",
    width : "100%",
    height : "30px",
    alignItems : "self-end"
  },
});

function exportToJsonFile(jsonData, filename) {
  let dataStr = JSON.stringify(jsonData);
  let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

  let exportFileDefaultName = filename;

  let linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  linkElement.remove()
}

class User extends React.Component {
  state = {
    user : null,
    open : false,
    account : ExtensionPointSchemaValidator("account")(),
    providerType : ''
  }

  handleToggle = () => {
    this.setState((state) => ({ open : !state.open }));
  };

  handleClose = (event) => {
    if (this.anchorEl.contains(event.target)) {
      return;
    }
    this.setState({ open : false });
  }

  handleLogout = () => {
    window.location = '/user/logout';
  };

  handlePreference = () => {
    this.props.router.push('/user/preferences');
  };

  handleGetToken = () => {
    dataFetch('/api/token', { credentials : 'same-origin' }, (data) => {
      exportToJsonFile(data, "auth.json");
    }, (error) => ({ error, }));
  };

  componentDidMount() {
    dataFetch('/api/user', {
      credentials : 'same-origin'
    }, (user) => {
      this.setState({ user });
      this.props.updateUser({ user });
    }, (error) => ({
      error,
    }));

    dataFetch(
      "/api/provider/capabilities", {
        method : "GET",
        credentials : "include", },
      (result) => {
        if (result) {
          this.setState({
            account : ExtensionPointSchemaValidator("account")(result?.extensions?.account),
            providerType : result?.provider_type
          })
        }
      },
      err => console.error(err)
    )
  }

  /**
   * @param {import("../utils/ExtensionPointSchemaValidator").AccountSchema[]} children
   */
  renderAccountExtension(children) {

    if (children && children.length > 0) {
      return (
        <List disablePadding>
          {children.map(({
            id, href, title, show : showc
          }) => {
            if (typeof showc !== "undefined" && !showc) {
              return "";
            }
            return (
              <React.Fragment key={id}>
                <ListItem
                  button
                  key={id}
                >
                  {this.extensionPointContent(href, title)}
                </ListItem>
              </React.Fragment>
            );
          })}
        </List>
      );
    }
  }

  extensionPointContent(href, name) {
    const { classes } = this.props;

    const content = (
      <div className={classNames(classes.link)} >
        <ListItemText
          classes={{ primary : classes.itemPrimary, }}
        >
          {name}
        </ListItemText>
      </div>
    );
    if (href) {
      return (
        <Link href={href}>
          <span
            className={classNames(classes.link)}
            onClick={() => this.props.updateExtensionType("account")}
          >
            {content}
          </span>
        </Link>
      )
    }

    return content;
  }

  render() {
    const {
      color, iconButtonClassName, avatarClassName, classes
    } = this.props;
    let avatar_url;
    if (this.state.user && this.state.user !== null) {
      avatar_url = this.state.user.avatar_url;
    }
    const { open } = this.state;
    return (
      <div>
        <NoSsr>
          <div data-test="profile-button">
            <IconButton
              color={color}
              className={iconButtonClassName}
              buttonRef={(node) => {
                this.anchorEl = node;
              }}
              aria-owns={open
                ? 'menu-list-grow'
                : undefined}
              aria-haspopup="true"
              onClick={this.handleToggle}
            >
              <Avatar className={avatarClassName} src={avatar_url} />
            </IconButton>
          </div>
          <Popper open={open} anchorEl={this.anchorEl} transition  style={{ zIndex : 10000 }} placement="top-end">
            {({ TransitionProps, placement }) => (
              <Grow
                {...TransitionProps}
                id="menu-list-grow"
                style={{ transformOrigin : placement === 'bottom'
                  ? 'left top'
                  : 'left bottom' }}
              >
                <Paper className={classes.popover}>
                  <ClickAwayListener onClickAway={this.handleClose}>
                    <MenuList>
                      {
                        this.state.account && this.state.account.length ?
                          (
                            <>
                              {this.renderAccountExtension(this.state.account)}
                            </>
                          )
                          :
                          null
                      }
                      <MenuItem onClick={this.handleGetToken}>Get Token</MenuItem>
                      <MenuItem onClick={this.handlePreference}>Preferences</MenuItem>
                      <MenuItem onClick={this.handleLogout}>Logout</MenuItem>
                    </MenuList>
                  </ClickAwayListener>
                </Paper>
              </Grow>
            )}
          </Popper>
        </NoSsr>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({ updateUser : bindActionCreators(updateUser, dispatch), });

export default withStyles(styles)(connect(
  null,
  mapDispatchToProps,
)(withRouter(User)));
