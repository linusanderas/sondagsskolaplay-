<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->unsignedInteger('episode_number')->nullable()->index();
            $table->text('description')->nullable();
            $table->string('participants')->nullable();
            $table->string('vimeo_id')->nullable()->index();
            $table->string('status')->default('draft'); // draft | published
            $table->boolean('is_preview')->default(false);
            $table->timestamps();
        });

        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('collection_video', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collection_id')->constrained()->cascadeOnDelete();
            $table->foreignId('video_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['collection_id', 'video_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_video');
        Schema::dropIfExists('collections');
        Schema::dropIfExists('videos');
    }
};
