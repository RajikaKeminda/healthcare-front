# Frontend Test Documentation

## Overview

This document provides comprehensive information about the testing strategy, structure, and execution for the Healthcare System frontend (Next.js 15 + React).

## Test Structure

```
frontend/tests/
├── setup.js                     # Global test setup and mocks
├── utils/
│   └── testHelpers.js          # Reusable test utilities and fixtures
├── unit/
│   ├── components/             # Unit tests for React components
│   │   └── LoadingSpinner.test.js
│   ├── contexts/               # Unit tests for React contexts
│   │   └── AuthContext.test.js
│   └── lib/                    # Unit tests for utility functions
│       └── api.test.js
└── integration/
    └── pages/                  # Integration tests for pages
        └── login.test.jsx
```

## Test Coverage Goals

- **Minimum Coverage**: 80% for all metrics
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Running Tests

### Run All Tests
```bash
cd frontend
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests in CI Mode
```bash
npm run test:ci
```

### Generate Coverage Report
```bash
npm test -- --coverage
```

## Test Categories

### 1. Component Tests (Unit)

**Location**: `tests/unit/components/`

**Purpose**: Test individual React components in isolation

**Examples**:
- LoadingSpinner rendering and props
- Component state management
- User interactions
- Conditional rendering
- Accessibility features

**Key Features**:
- ✅ Props validation
- ✅ Rendering logic
- ✅ User events
- ✅ CSS classes
- ✅ Accessibility (ARIA, keyboard navigation)

**Example**:
```javascript
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('should render with default size', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-class');
  });
});
```

### 2. Context Tests (Unit)

**Location**: `tests/unit/contexts/`

**Purpose**: Test React Context providers and custom hooks

**Examples**:
- AuthContext state management
- Login/logout functionality
- User authentication flow
- Error handling
- Loading states

**Key Features**:
- ✅ Initial state
- ✅ State updates
- ✅ API integration
- ✅ Error scenarios
- ✅ Async operations

**Example**:
```javascript
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../../contexts/AuthContext';
import { authAPI } from '../../../lib/api';

jest.mock('../../../lib/api');

describe('AuthContext', () => {
  it('should login successfully', async () => {
    const mockUser = { _id: '123', email: 'test@test.com' };
    authAPI.login.mockResolvedValue({ data: { success: true, data: { user: mockUser } } });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.login('test@test.com', 'password');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### 3. API Client Tests (Unit)

**Location**: `tests/unit/lib/`

**Purpose**: Test API client functions and axios integration

**Examples**:
- API endpoint calls
- Request parameters
- Response handling
- Error handling
- Authentication headers

**Key Features**:
- ✅ Method calls (GET, POST, PUT, DELETE)
- ✅ Query parameters
- ✅ Request body
- ✅ Error responses
- ✅ Token handling

**Example**:
```javascript
import { authAPI, usersAPI } from '../../../lib/api';
import axios from 'axios';

jest.mock('axios');

describe('API Client', () => {
  it('should call login endpoint', async () => {
    const mockResponse = { data: { success: true } };
    axios.post.mockResolvedValue(mockResponse);

    const result = await authAPI.login({ email: 'test@test.com', password: 'pass' });

    expect(axios.post).toHaveBeenCalled();
    expect(result).toEqual(mockResponse);
  });
});
```

### 4. Page Tests (Integration)

**Location**: `tests/integration/pages/`

**Purpose**: Test complete page functionality with user interactions

**Examples**:
- Form submission
- Navigation
- API integration
- User workflows
- Error displays
- Loading states

**Key Features**:
- ✅ Full user flows
- ✅ Form validation
- ✅ API mocking
- ✅ Router navigation
- ✅ Error handling
- ✅ Accessibility

**Example**:
```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../../../app/login/page';
import { authAPI } from '../../../lib/api';

jest.mock('../../../lib/api');

describe('Login Page', () => {
  it('should submit form with valid credentials', async () => {
    authAPI.login.mockResolvedValue({ data: { success: true } });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password123!');
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'Password123!',
      });
    });
  });
});
```

## Test Utilities

### Test Helpers (`tests/utils/testHelpers.js`)

**Mock Data**:
- `mockPatient` - Sample patient user
- `mockDoctor` - Sample doctor user
- `mockStaff` - Sample staff user
- `mockManager` - Sample manager user
- `mockAppointment` - Sample appointment
- `mockPayment` - Sample payment
- `mockMedicalRecord` - Sample medical record

**Helper Functions**:
- `renderWithAuth(component, options)` - Render component with AuthContext
- `mockAxiosSuccess(data)` - Create successful axios response
- `mockAxiosError(message, status)` - Create error response
- `waitForLoadingToFinish()` - Wait for async operations
- `mockPrint()` - Mock window.print
- `mockWindowOpen()` - Mock window.open

**Usage Example**:
```javascript
import { renderWithAuth, mockPatient } from '../../utils/testHelpers';

const { getByText } = renderWithAuth(<MyComponent />, { user: mockPatient });
```

### Test Setup (`tests/setup.js`)

**Features**:
- Testing Library DOM matchers
- Next.js router mocking
- Window API mocks (matchMedia, scrollTo, ResizeObserver)
- localStorage mock
- fetch mock
- Console suppression

## Writing New Tests

### Best Practices

1. **Use Testing Library Queries**
   ```javascript
   // Good ✅
   screen.getByRole('button', { name: /submit/i })
   screen.getByLabelText(/email/i)
   screen.getByText(/welcome/i)
   
   // Avoid ❌
   document.querySelector('.button')
   wrapper.find('#email-input')
   ```

2. **User-Centric Testing**
   ```javascript
   // Simulate real user interactions
   await userEvent.type(input, 'test@test.com');
   await userEvent.click(button);
   await userEvent.tab();
   ```

3. **Async Operations**
   ```javascript
   // Always use waitFor for async updates
   await waitFor(() => {
     expect(screen.getByText(/success/i)).toBeInTheDocument();
   });
   ```

4. **Mock External Dependencies**
   ```javascript
   jest.mock('../../../lib/api');
   jest.mock('next/navigation');
   
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

5. **Test Accessibility**
   ```javascript
   expect(button).toHaveAccessibleName();
   expect(input).toHaveAccessibleDescription();
   expect(heading).toBeInTheDocument();
   ```

### Example Test Structure

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  describe('Rendering', () => {
    it('should render component', () => {
      render(<MyComponent />);
      expect(screen.getByText(/component title/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle button click', async () => {
      render(<MyComponent />);
      const button = screen.getByRole('button', { name: /click me/i });
      
      await userEvent.click(button);
      
      expect(screen.getByText(/clicked/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for invalid input', async () => {
      render(<MyComponent />);
      const input = screen.getByLabelText(/email/i);
      
      await userEvent.type(input, 'invalid');
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty state', () => {
      render(<MyComponent items={[]} />);
      expect(screen.getByText(/no items/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      render(<MyComponent />);
      const firstButton = screen.getAllByRole('button')[0];
      
      firstButton.focus();
      expect(firstButton).toHaveFocus();
      
      await userEvent.tab();
      expect(screen.getAllByRole('button')[1]).toHaveFocus();
    });
  });
});
```

## Common Testing Patterns

### Testing Forms

```javascript
it('should submit form successfully', async () => {
  render(<MyForm />);
  
  await userEvent.type(screen.getByLabelText(/name/i), 'John Doe');
  await userEvent.type(screen.getByLabelText(/email/i), 'john@test.com');
  
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

### Testing API Calls

```javascript
it('should fetch and display data', async () => {
  const mockData = [{ id: 1, name: 'Item 1' }];
  api.getData.mockResolvedValue({ data: { success: true, data: mockData } });
  
  render(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });
});
```

### Testing Error States

```javascript
it('should display error message', async () => {
  api.getData.mockRejectedValue({ 
    response: { data: { message: 'Error occurred' } } 
  });
  
  render(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
  });
});
```

### Testing Loading States

```javascript
it('should show loading spinner', () => {
  api.getData.mockImplementation(() => new Promise(() => {})); // Never resolves
  
  render(<MyComponent />);
  
  expect(screen.getByRole('status')).toBeInTheDocument();
});
```

### Testing Conditional Rendering

```javascript
it('should render based on user role', () => {
  render(<MyComponent user={{ role: 'admin' }} />);
  expect(screen.getByText(/admin panel/i)).toBeInTheDocument();
  
  render(<MyComponent user={{ role: 'patient' }} />);
  expect(screen.queryByText(/admin panel/i)).not.toBeInTheDocument();
});
```

## Debugging Tests

### View Component Output
```javascript
const { debug } = render(<MyComponent />);
debug(); // Prints DOM to console
```

### Check Rendered HTML
```javascript
screen.logTestingPlaygroundURL(); // Opens Testing Playground
```

### Query Debugging
```javascript
screen.debug(screen.getByRole('button'));
```

## Mocking Strategies

### Mock Next.js Router
```javascript
// Already mocked in setup.js
const mockPush = jest.fn();
useRouter.mockReturnValue({ push: mockPush });
```

### Mock API Responses
```javascript
authAPI.login.mockResolvedValue({
  data: { success: true, data: { user: mockUser } }
});
```

### Mock Context Values
```javascript
const mockAuthContext = {
  user: mockPatient,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
};
```

## Coverage Reports

View detailed coverage:
```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

## Continuous Integration

The test suite runs automatically in CI:
```bash
npm run test:ci
```

Features:
- Runs all tests once
- Generates coverage reports
- Fails build if coverage < 80%
- Optimized for CI environments

## Troubleshooting

### Common Issues

1. **"Not wrapped in act(...)" warnings**
   ```javascript
   // Use waitFor for async updates
   await waitFor(() => {
     expect(element).toBeInTheDocument();
   });
   ```

2. **"Unable to find element" errors**
   ```javascript
   // Wait for element to appear
   await screen.findByText(/expected text/i);
   ```

3. **Mock not working**
   ```javascript
   // Clear mocks between tests
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

4. **Async timing issues**
   ```javascript
   // Increase timeout for slow operations
   await waitFor(() => {
     expect(something).toBeDefined();
   }, { timeout: 5000 });
   ```

## Quality Metrics

### Coverage Thresholds
- All metrics must be ≥80%
- Build fails if thresholds not met
- Enforced in CI/CD pipeline

### Test Quality Checklist
- ✅ Tests are isolated and independent
- ✅ Tests follow AAA pattern (Arrange, Act, Assert)
- ✅ Tests use semantic queries (role, label, text)
- ✅ Tests cover positive, negative, and edge cases
- ✅ Async operations properly handled
- ✅ Accessibility tested
- ✅ Error scenarios covered
- ✅ Loading states tested

## Contributing

When adding new features:

1. Write tests first or alongside feature
2. Ensure all tests pass
3. Maintain >80% coverage
4. Follow existing patterns
5. Test user interactions
6. Test accessibility
7. Document complex scenarios

## Resources

- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

