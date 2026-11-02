<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VideoController extends Controller
{
    public function index()
    {
        return response()->json(
            Video::query()->orderBy('episode_number')->orderBy('title')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'episode_number' => ['nullable', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
            'participants' => ['nullable', 'string', 'max:255'],
            'vimeo_id' => ['nullable', 'string', 'max:64'],
            'status' => ['nullable', Rule::in(['draft', 'published'])],
            'is_preview' => ['nullable', 'boolean'],
        ]);

        $video = Video::create([
            ...$data,
            'status' => $data['status'] ?? 'published',
            'is_preview' => $data['is_preview'] ?? false,
        ]);

        return response()->json($video, 201);
    }
}
