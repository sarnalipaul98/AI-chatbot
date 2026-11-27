# AI Chatbot – API Documentation
## 1. Introduction
This document explains the backend APIs used in the AI Chatbot application. These APIs connect the frontend with the backend and handle user accounts, conversations, messages, AI responses and admin analytics.

## 2. Base URL
**Local development:**

`http://localhost:5000`

**Deployed backend:**

`https://ai-chatbot-backend-asjq.onrender.com`

All API endpoints are accessed by adding their paths to the base URL.

## 3. Authentication

The application uses JSON Web Tokens (JWT) to protect user accounts and private API routes.

After a successful login, the server returns an authentication token. For protected routes, include this header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

The token expires after 7 days. Users must log in again after it expires.

Admin routes require both a valid token and an admin account.

## 4. API Endpoints

### A. Authentication APIs

**1. Register User**

- Method: `POST`
- Endpoint: `/api/auth/register`
- Purpose: Creates a new user account.

Request body:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

Successful response: `201 Created`

Returns a success message and basic user details.

**2. Login User**

- Method: `POST`
- Endpoint: `/api/auth/login`
- Purpose: Checks user credentials and provides a JWT token.

Request body:

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

Successful response: `200 OK`

Returns a success message, authentication token and user details.

**3. Get Logged-in User**

- Method: `GET`
- Endpoint: `/api/auth/me`
- Authentication: Required
- Purpose: Retrieves the details of the currently logged-in user.

Successful response: `200 OK`

Returns the user details without the password.

### B. Profile and Settings APIs

**4. Update Profile**

- Method: `PUT`
- Endpoint: `/api/auth/profile`
- Authentication: Required
- Purpose: Updates the user's name.

Request body:

```json
{
  "name": "Updated Name"
}
```

**5. Change Password**

- Method: `PUT`
- Endpoint: `/api/auth/change-password`
- Authentication: Required
- Purpose: Changes the user's password after checking the current password.

Request body:

```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

**6. Update Theme**

- Method: `PUT`
- Endpoint: `/api/auth/theme`
- Authentication: Required
- Purpose: Saves the user's selected light or dark theme.

Request body:

```json
{
  "theme": "dark"
}
```

**7. Update Chatbot Name**

- Method: `PUT`
- Endpoint: `/api/auth/chatbot-name`
- Authentication: Required
- Purpose: Updates the personalized chatbot name.

Request body:

```json
{
  "chatbotName": "My Assistant"
}
```

The chatbot name must contain between 1 and 30 characters.

### C. Conversation APIs

All conversation endpoints require authentication.

**8. Create Conversation**

- Method: `POST`
- Endpoint: `/api/conversations`
- Purpose: Creates a new chat conversation.

Request body:

```json
{
  "title": "My New Chat",
  "category": "educational"
}
```

Available categories are casual, professional, creative, educational and coding. If no category is provided, casual is selected by default.

Successful response: `201 Created`

**9. Get All Conversations**

- Method: `GET`
- Endpoint: `/api/conversations`
- Purpose: Retrieves the logged-in user's conversations, sorted by latest activity.

Successful response: `200 OK`

**10. Get Conversation by ID**

- Method: `GET`
- Endpoint: `/api/conversations/:id`
- Purpose: Retrieves one conversation and its messages.

Replace `:id` with the conversation ID.

Successful response: `200 OK`

**11. Delete Conversation**

- Method: `DELETE`
- Endpoint: `/api/conversations/:id`
- Purpose: Deletes a conversation and its associated messages.

Successful response: `200 OK`

### D. Message APIs

All message endpoints require authentication.

**12. Save Message**

- Method: `POST`
- Endpoint: `/api/messages`
- Purpose: Saves a user's message in a conversation.

Request body:

```json
{
  "conversationId": "CONVERSATION_ID",
  "content": "Hello, how are you?"
}
```

Successful response: `201 Created`

**13. Get Messages**

- Method: `GET`
- Endpoint: `/api/messages/:conversationId`
- Purpose: Retrieves all messages from a selected conversation.

Replace `:conversationId` with the conversation ID.

Successful response: `200 OK`

**14. Rate AI Response**

- Method: `PUT`
- Endpoint: `/api/messages/:id/rating`
- Purpose: Allows a user to rate an AI response.

Request body:

```json
{
  "rating": 5
}
```

The rating must be a whole number between 1 and 5.

Successful response: `200 OK`

### E. AI Chat API

**15. Generate AI Response**

- Method: `POST`
- Endpoint: `/api/ai/chat`
- Authentication: Required
- Purpose: Sends a user message to the AI service and returns an AI-generated response.

Request body:

```json
{
  "conversationId": "CONVERSATION_ID",
  "content": "Explain artificial intelligence."
}
```

Successful response: `200 OK`

Returns the saved user message and AI response. A cached response may also include `"cached": true`.

The API checks the conversation category and uses it to guide the AI's response style. It also saves messages in the database and broadcasts new messages through Socket.IO.

The message length is limited to 4,000 characters. The endpoint allows 10 requests per minute per client.

### F. Admin API

**16. Get Admin Analytics**

- Method: `GET`
- Endpoint: `/api/admin/analytics`
- Authentication: Required
- Access: Admin only
- Purpose: Retrieves application statistics for the admin dashboard.

Successful response: `200 OK`

The response includes:

- Total registered users.
- Total conversations.
- Total messages.
- Total user messages.
- Total AI responses.
- Active users in the last 24 hours.
- Average AI response rating.
- Daily message activity for the last 7 days.
- Recent chat activity.

## 5. Common HTTP Status Codes

| Status Code | Meaning |
|---|---|
| 200 | Request completed successfully |
| 201 | New resource created successfully |
| 400 | Invalid or missing request data |
| 401 | Authentication required or token invalid |
| 403 | Access denied |
| 404 | Requested resource not found |
| 409 | Email already registered |
| 429 | Too many requests |
| 500 | Internal server error |

## 6. Security Features

The backend includes the following security measures:

- Passwords are hashed using bcryptjs before being stored.
- JWT tokens are used for authentication.
- Protected routes check the user's login status.
- Admin routes are restricted to admin accounts.
- AI chat requests are limited to 10 per minute.
- Users can access only their own conversations and messages.
- Input validation is used for important user requests.

## 7. Conclusion
The API layer connects the frontend and backend of the AI Chatbot application. It handles authentication, user settings, conversation management, message storage, AI responses and admin analytics. These APIs help the application work as a complete chatbot system while maintaining user security and data privacy.