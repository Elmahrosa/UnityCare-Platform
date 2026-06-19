// tRPC is not configured in this deployment.
// The API client is in src/services/apiService.js using axios.
// This file exists for future tRPC integration.

export const trpc = {
  useUtils: () => ({}),
  auth: {
    me: {
      useQuery: () => ({ data: null, isLoading: false, error: null }),
    },
    logout: {
      useMutation: () => ({ mutateAsync: async () => {}, isPending: false }),
    },
  },
};
