<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CollectionController extends Controller
{
    public function index()
    {
        return response()->json(
            Collection::query()->with('videos')->orderBy('name')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:collections,slug'],
            'description' => ['nullable', 'string'],
            'video_ids' => ['nullable', 'array'],
            'video_ids.*' => ['integer', 'exists:videos,id'],
        ]);

        $collection = Collection::create([
            'name' => $data['name'],
            'slug' => $data['slug'] ?? Str::slug($data['name']),
            'description' => $data['description'] ?? null,
        ]);

        if (! empty($data['video_ids'])) {
            $sync = [];
            foreach (array_values($data['video_ids']) as $index => $videoId) {
                $sync[$videoId] = ['sort_order' => $index];
            }
            $collection->videos()->sync($sync);
        }

        return response()->json($collection->load('videos'), 201);
    }
}
