'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parcoursAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { SavedParcours } from '@/types';

export const MAX_SAVED_PARCOURS = 6;

type ParcoursInput = Omit<SavedParcours, 'id'>;

const sameParcours = (a: ParcoursInput, b: ParcoursInput) =>
    a.cycle === b.cycle && a.filiere === b.filiere && a.year === b.year && a.semester === b.semester;

// Link to the resources page for a parcours (same URL format as the parcours picker)
export const parcoursHref = (p: ParcoursInput) => {
    const params = new URLSearchParams({ cycle: p.cycle, year: p.year, semester: p.semester, filiere: p.filiere });
    return `/resources?${params.toString()}`;
};

// The signed-in user's saved parcours (max 6), shared across pages through react-query
export function useSavedParcours() {
    const queryClient = useQueryClient();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const userId = useAuthStore((s) => s.user?.id);
    // Keyed by user so a different account on the same browser never sees someone else's list
    const queryKey = ['savedParcours', userId];

    const { data: saved = [], isLoading } = useQuery({
        queryKey,
        queryFn: async () => (await parcoursAPI.getSaved()).data.parcours as SavedParcours[],
        enabled: isAuthenticated && !!userId,
    });

    const setSaved = (response: { data: { parcours: SavedParcours[] } }) =>
        queryClient.setQueryData(queryKey, response.data.parcours);

    const saveMutation = useMutation({
        mutationFn: (p: ParcoursInput) => parcoursAPI.save(p),
        onSuccess: setSaved,
    });

    const removeMutation = useMutation({
        mutationFn: (id: string) => parcoursAPI.remove(id),
        onSuccess: setSaved,
    });

    const findSaved = (p: ParcoursInput) => saved.find((s) => sameParcours(s, p));

    return {
        saved: isAuthenticated ? saved : [],
        isLoading,
        isFull: saved.length >= MAX_SAVED_PARCOURS,
        findSaved,
        save: saveMutation.mutateAsync,
        remove: removeMutation.mutateAsync,
        isSaving: saveMutation.isPending || removeMutation.isPending,
        error: (saveMutation.error || removeMutation.error) as any,
    };
}
