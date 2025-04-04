<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('clearpw', 127)->nullable();
            $table->string('emailpw', 127)->nullable();
            $table->boolean('active')->default(1);
            $table->integer('gid')->default(1000);
            $table->integer('uid')->default(1000);
            $table->string('home', 127)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'clearpw',
                'emailpw',
                'active',
                'gid',
                'uid',
                'home',
            ]);
        });
    }
};
