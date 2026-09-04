package com.example.weathergpt

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import androidx.viewpager2.widget.ViewPager2
import com.example.weathergpt.data.local.PreferencesManager
import com.google.android.material.button.MaterialButton

class OnboardingActivity : AppCompatActivity() {

    private lateinit var prefs: PreferencesManager
    private lateinit var viewPager: ViewPager2
    private lateinit var btnNext: MaterialButton
    private lateinit var btnSkip: TextView

    private val languages = listOf(
        "English" to "en",
        "हिंदी (Hindi)" to "hi",
        "தமிழ் (Tamil)" to "ta",
        "తెలుగు (Telugu)" to "te",
        "বাংলা (Bengali)" to "bn",
        "मराठी (Marathi)" to "mr",
        "ગુજરાતી (Gujarati)" to "gu"
    )

    private val personas = listOf(
        "🌾 Farming & Agriculture" to "farmer",
        "🚗 Daily Travel & Commute" to "commuter",
        "✈️ Aviation & Long Trips" to "aviation",
        "🏃 Outdoor Sports & Health" to "outdoor"
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_onboarding)

        prefs = PreferencesManager(this)
        viewPager = findViewById(R.id.viewPagerOnboarding)
        btnNext = findViewById(R.id.btnNextOnboarding)
        btnSkip = findViewById(R.id.btnSkipOnboarding)

        viewPager.adapter = OnboardingAdapter()

        viewPager.registerOnPageChangeCallback(object : ViewPager2.OnPageChangeCallback() {
            override fun onPageSelected(position: Int) {
                when (position) {
                    0 -> {
                        btnNext.text = getString(R.string.btn_get_started)
                        btnSkip.visibility = View.VISIBLE
                    }
                    1 -> {
                        btnNext.text = getString(R.string.btn_allow_location)
                        btnSkip.visibility = View.VISIBLE
                    }
                    2 -> {
                        btnNext.text = getString(R.string.btn_continue)
                        btnSkip.visibility = View.VISIBLE
                    }
                    3 -> {
                        btnNext.text = getString(R.string.btn_continue)
                        btnSkip.visibility = View.GONE
                    }
                }
            }
        })

        btnNext.setOnClickListener {
            val current = viewPager.currentItem
            if (current == 1) {
                // Request location permission
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(
                        this,
                        arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION),
                        101
                    )
                }
                viewPager.currentItem = current + 1
            } else if (current < 3) {
                viewPager.currentItem = current + 1
            } else {
                finishOnboarding()
            }
        }

        btnSkip.setOnClickListener {
            finishOnboarding()
        }
    }

    private fun finishOnboarding() {
        prefs.isOnboardingCompleted = true
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }

    inner class OnboardingAdapter : RecyclerView.Adapter<OnboardingAdapter.OnboardingViewHolder>() {

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): OnboardingViewHolder {
            val view = LayoutInflater.from(parent.context).inflate(R.layout.item_onboarding_page, parent, false)
            return OnboardingViewHolder(view)
        }

        override fun onBindViewHolder(holder: OnboardingViewHolder, position: Int) {
            holder.layoutOptions.removeAllViews()
            holder.layoutOptions.visibility = View.GONE

            when (position) {
                0 -> {
                    holder.tvIcon.text = "🌦️"
                    holder.tvTitle.text = getString(R.string.onboarding_title_1)
                    holder.tvDesc.text = getString(R.string.onboarding_desc_1)
                }
                1 -> {
                    holder.tvIcon.text = "📍"
                    holder.tvTitle.text = getString(R.string.onboarding_title_2)
                    holder.tvDesc.text = getString(R.string.onboarding_desc_2)
                }
                2 -> {
                    holder.tvIcon.text = "🌐"
                    holder.tvTitle.text = getString(R.string.onboarding_title_3)
                    holder.tvDesc.text = getString(R.string.onboarding_desc_3)
                    holder.layoutOptions.visibility = View.VISIBLE

                    // Build Language Buttons with large touch targets
                    for ((label, code) in languages) {
                        val btn = MaterialButton(this@OnboardingActivity)
                        btn.text = label
                        btn.textSize = 15f
                        btn.layoutParams = LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.MATCH_PARENT,
                            LinearLayout.LayoutParams.WRAP_CONTENT
                        ).apply { setMargins(0, 8, 0, 8) }

                        if (prefs.language == code) {
                            btn.setBackgroundColor(ContextCompat.getColor(this@OnboardingActivity, R.color.accent_cyan))
                            btn.setTextColor(ContextCompat.getColor(this@OnboardingActivity, R.color.text_dark))
                        } else {
                            btn.setBackgroundColor(ContextCompat.getColor(this@OnboardingActivity, R.color.bg_card))
                            btn.setTextColor(ContextCompat.getColor(this@OnboardingActivity, R.color.text_primary))
                        }

                        btn.setOnClickListener {
                            prefs.language = code
                            notifyItemChanged(2)
                        }
                        holder.layoutOptions.addView(btn)
                    }
                }
                3 -> {
                    holder.tvIcon.text = "🌾"
                    holder.tvTitle.text = getString(R.string.onboarding_title_4)
                    holder.tvDesc.text = getString(R.string.onboarding_desc_4)
                    holder.layoutOptions.visibility = View.VISIBLE

                    // Build Persona Buttons with large touch targets
                    for ((label, id) in personas) {
                        val btn = MaterialButton(this@OnboardingActivity)
                        btn.text = label
                        btn.textSize = 15f
                        btn.layoutParams = LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.MATCH_PARENT,
                            LinearLayout.LayoutParams.WRAP_CONTENT
                        ).apply { setMargins(0, 8, 0, 8) }

                        if (prefs.persona == id) {
                            btn.setBackgroundColor(ContextCompat.getColor(this@OnboardingActivity, R.color.accent_farmer_light))
                            btn.setTextColor(ContextCompat.getColor(this@OnboardingActivity, R.color.text_dark))
                        } else {
                            btn.setBackgroundColor(ContextCompat.getColor(this@OnboardingActivity, R.color.bg_card))
                            btn.setTextColor(ContextCompat.getColor(this@OnboardingActivity, R.color.text_primary))
                        }

                        btn.setOnClickListener {
                            prefs.persona = id
                            notifyItemChanged(3)
                        }
                        holder.layoutOptions.addView(btn)
                    }
                }
            }
        }

        override fun getItemCount(): Int = 4

        inner class OnboardingViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val tvIcon: TextView = view.findViewById(R.id.tvOnboardingIcon)
            val tvTitle: TextView = view.findViewById(R.id.tvOnboardingTitle)
            val tvDesc: TextView = view.findViewById(R.id.tvOnboardingDescription)
            val layoutOptions: LinearLayout = view.findViewById(R.id.layoutDynamicOptions)
        }
    }
}
