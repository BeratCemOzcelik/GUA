# API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://gua.edu.pl/api
```

## Authentication

All protected endpoints require JWT bearer token:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token

### Departments
- `GET /api/departments` - List all departments
- `GET /api/departments/{id}` - Get department details
- `POST /api/departments` - Create department [Admin]
- `PUT /api/departments/{id}` - Update department [Admin]
- `DELETE /api/departments/{id}` - Delete department [Admin]

### Programs
- `GET /api/programs` - List all programs
- `GET /api/programs/{id}` - Get program details
- `POST /api/programs` - Create program [Admin]
- `PUT /api/programs/{id}` - Update program [Admin]
- `DELETE /api/programs/{id}` - Delete program [Admin]

### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/{id}` - Get course details
- `POST /api/courses` - Create course [Admin]
- `PUT /api/courses/{id}` - Update course [Admin]
- `DELETE /api/courses/{id}` - Delete course [Admin]

*More endpoints will be documented as development progresses.*

## Error Responses

```json
{
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2026-02-21T12:00:00Z"
}
```

## Pagination

List endpoints support pagination:
```
GET /api/courses?page=1&pageSize=10
```

Response:
```json
{
  "data": [...],
  "totalCount": 100,
  "page": 1,
  "pageSize": 10,
  "totalPages": 10
}
```
