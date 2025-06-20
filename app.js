"use strict";
const apiBase = "http://localhost:5000/api";
let token = null;
let currentUser = null;
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const showLoginBtn = document.getElementById("show-login");
const showRegisterBtn = document.getElementById("show-register");
const logoutBtn = document.getElementById("logout");
const userInfo = document.getElementById("user-info");
const authForms = document.getElementById("auth-forms");
const createPostSection = document.getElementById("create-post");
const postsList = document.getElementById("posts-list");
showLoginBtn.addEventListener("click", () => {
  loginForm.style.display = "block";
  registerForm.style.display = "none";
});
showRegisterBtn.addEventListener("click", () => {
  registerForm.style.display = "block";
  loginForm.style.display = "none";
});
logoutBtn.addEventListener("click", () => {
  token = null;
  currentUser = null;
  localStorage.removeItem("token");
  updateUI();
});
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  try {
    const res = await fetch(`${apiBase}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      token = data.token;
      currentUser = data.user;
      localStorage.setItem("token", token);
      updateUI();
      loginForm.reset();
    } else {
      alert(data.message || "Login failed");
    }
  } catch (error) {
    alert("Error logging in");
  }
});
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("register-username").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  try {
    const res = await fetch(`${apiBase}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      token = data.token;
      currentUser = data.user;
      localStorage.setItem("token", token);
      updateUI();
      registerForm.reset();
    } else {
      alert(data.message || "Registration failed");
    }
  } catch (error) {
    alert("Error registering");
  }
});
document.getElementById("submit-post").addEventListener("click", async () => {
  const title = document.getElementById("post-title").value;
  const body = document.getElementById("post-body").value;
  if (!title || !body) {
    alert("Title and body are required");
    return;
  }
  try {
    const res = await fetch(`${apiBase}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, body }),
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById("post-title").value = "";
      document.getElementById("post-body").value = "";
      loadPosts();
    } else {
      alert(data.message || "Failed to create post");
    }
  } catch (error) {
    alert("Error creating post");
  }
});
async function loadPosts() {
  try {
    const res = await fetch(`${apiBase}/posts`);
    const posts = await res.json();
    postsList.innerHTML = "";
    posts.forEach((post) => {
      const postDiv = document.createElement("div");
      postDiv.className = "post";
      const title = document.createElement("div");
      title.className = "post-title";
      title.textContent = post.title;
      postDiv.appendChild(title);
      const author = document.createElement("div");
      author.className = "post-author";
      author.textContent = `by ${post.author.username}`;
      postDiv.appendChild(author);
      const body = document.createElement("div");
      body.className = "post-body";
      body.textContent = post.body;
      postDiv.appendChild(body);
      const votes = document.createElement("span");
      votes.textContent = `Votes: ${post.votes}`;
      postDiv.appendChild(votes);
      if (token) {
        const upvoteBtn = document.createElement("button");
        const upvoteImg = document.createElement("img");
        upvoteImg.src = "upvote.png";
        upvoteImg.alt = "Upvote";
        upvoteImg.style.width = "20px";
        upvoteImg.style.height = "20px";
        upvoteBtn.appendChild(upvoteImg);
        upvoteBtn.onclick = () => votePost(post._id, 1);

        const downvoteBtn = document.createElement("button");
        const downvoteImg = document.createElement("img");
        downvoteImg.src = "downvote.png";
        downvoteImg.alt = "Downvote";
        downvoteImg.style.width = "20px";
        downvoteImg.style.height = "20px";
        downvoteBtn.appendChild(downvoteImg);
        downvoteBtn.onclick = () => votePost(post._id, -1);

        postDiv.appendChild(upvoteBtn);
        postDiv.appendChild(downvoteBtn);
      }
      // Comments section
      const commentsDiv = document.createElement("div");
      commentsDiv.className = "comments";
      const commentList = document.createElement("div");
      commentList.className = "comment-list";
      commentsDiv.appendChild(commentList);
      const commentForm = document.createElement("form");
      commentForm.onsubmit = async (e) => {
        e.preventDefault();
        const commentBody = e.target.elements["comment-body"].value;
        if (!commentBody) return;
        await addComment(post._id, commentBody);
        e.target.reset();
        loadPosts();
      };
      const commentInput = document.createElement("input");
      commentInput.name = "comment-body";
      commentInput.placeholder = "Add a comment";
      commentForm.appendChild(commentInput);
      const commentSubmit = document.createElement("button");
      commentSubmit.type = "submit";
      commentSubmit.textContent = "Comment";
      commentForm.appendChild(commentSubmit);
      commentsDiv.appendChild(commentForm);
      postDiv.appendChild(commentsDiv);
      postsList.appendChild(postDiv);
      // Load comments for the post
      loadComments(post._id, commentList);
    });
  } catch (error) {
    console.error("Error loading posts:", error);
  }
}
async function loadComments(postId, commentList) {
  try {
    const res = await fetch(`${apiBase}/comments/post/${postId}`);
    const comments = await res.json();
    commentList.innerHTML = "";
    comments.forEach((comment) => {
      const commentDiv = document.createElement("div");
      commentDiv.className = "comment";
      const author = document.createElement("div");
      author.className = "comment-author";
      author.textContent = comment.author.username;
      commentDiv.appendChild(author);
      const body = document.createElement("div");
      body.className = "comment-body";
      body.textContent = comment.body;
      commentDiv.appendChild(body);
      const votes = document.createElement("span");
      votes.textContent = `Votes: ${comment.votes}`;
      commentDiv.appendChild(votes);
      if (token) {
        const upvoteBtn = document.createElement("button");
        const upvoteImg = document.createElement("img");
        upvoteImg.src = "upvote.png";
        upvoteImg.alt = "Upvote";
        upvoteImg.style.width = "16px";
        upvoteImg.style.height = "16px";
        upvoteBtn.appendChild(upvoteImg);
        upvoteBtn.onclick = () => voteComment(comment._id, 1);

        const downvoteBtn = document.createElement("button");
        const downvoteImg = document.createElement("img");
        downvoteImg.src = "downvote.png";
        downvoteImg.alt = "Downvote";
        downvoteImg.style.width = "16px";
        downvoteImg.style.height = "16px";
        downvoteBtn.appendChild(downvoteImg);
        downvoteBtn.onclick = () => voteComment(comment._id, -1);

        commentDiv.appendChild(upvoteBtn);
        commentDiv.appendChild(downvoteBtn);
      }
      commentList.appendChild(commentDiv);
    });
  } catch (error) {
    console.error("Error loading comments:", error);
  }
}
async function votePost(postId, vote) {
  try {
    const res = await fetch(`${apiBase}/posts/${postId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ vote }),
    });
    if (res.ok) {
      loadPosts();
    } else {
      const data = await res.json();
      alert(data.message || "Failed to vote");
    }
  } catch (error) {
    alert("Error voting post");
  }
}
async function voteComment(commentId, vote) {
  try {
    const res = await fetch(`${apiBase}/comments/${commentId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ vote }),
    });
    if (res.ok) {
      loadPosts();
    } else {
      const data = await res.json();
      alert(data.message || "Failed to vote");
    }
  } catch (error) {
    alert("Error voting comment");
  }
}
function updateUI() {
  if (token) {
    showLoginBtn.style.display = "none";
    showRegisterBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    userInfo.textContent = `Logged in as ${currentUser.username}`;
    authForms.style.display = "none";
    createPostSection.style.display = "block";
  } else {
    showLoginBtn.style.display = "inline-block";
    showRegisterBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    userInfo.textContent = "";
    authForms.style.display = "block";
    createPostSection.style.display = "none";
    loginForm.style.display = "none";
    registerForm.style.display = "none";
  }
}
function init() {
  token = localStorage.getItem("token");
  if (token) {
    // Optionally, fetch user profile to verify token
    fetch(`${apiBase}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.username) {
          currentUser = data;
        } else {
          token = null;
          localStorage.removeItem("token");
        }
        updateUI();
        loadPosts();
      })
      .catch(() => {
        token = null;
        localStorage.removeItem("token");
        updateUI();
        loadPosts();
      });
  } else {
    updateUI();
    loadPosts();
  }
}
init();
